package com.controlpad.mobile.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import com.composables.icons.lucide.Lucide
import com.composables.icons.lucide.*
import kotlinx.coroutines.flow.first
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.controlpad.mobile.data.AppConfig
import com.controlpad.mobile.data.ControlBlock
import com.controlpad.mobile.data.NetworkModule
import com.controlpad.mobile.data.SettingsRepository
import com.controlpad.mobile.ui.components.ControlBlockItem
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    navController: NavController,
    repository: SettingsRepository
) {
    val scope = rememberCoroutineScope()
    var config by remember { mutableStateOf<AppConfig?>(null) }
    var currentPageIndex by remember { mutableStateOf(0) }
    var showPageManager by remember { mutableStateOf(false) }
    var isEditMode by remember { mutableStateOf(false) }
    var loading by remember { mutableStateOf(true) }

    // Config Loading
    LaunchedEffect(Unit) {
        repository.serverUrl.collect { url ->
            if (url != null) {
                try {
                    val api = NetworkModule.getApiService(url, repository)
                    val res = api.getConfig()
                    if (res.isSuccessful) {
                        config = res.body()
                    }
                } catch (e: Exception) {
                    // Handle error
                } finally {
                    loading = false
                }
            } else {
                navController.navigate("login")
            }
        }
    }

    val currentPage = config?.pages?.getOrNull(currentPageIndex)

    // Actions
    fun executeBlock(block: ControlBlock) {
        scope.launch {
            repository.serverUrl.collect { url ->
                if (url == null) return@collect
                val api = NetworkModule.getApiService(url, repository)
                try {
                    if (block.actionType == "yeelight" && block.yeelightConfig != null) {
                        api.postGeneric(url + "/api/yeelight-toggle", mapOf("action" to "toggle", "yeelightIp" to block.yeelightConfig.ip))
                    } else {
                        api.executeAction(block)
                    }
                } catch (e: Exception) {
                    // Toast error
                }
            }
        }
    }

    var showSettingsDialog by remember { mutableStateOf(false) }
    var isPcOnline by remember { mutableStateOf<Boolean?>(null) }

    // PC Status polling
    LaunchedEffect(Unit) {
        while(true) {
            val url = repository.serverUrl.first()
            if (url != null) {
                try {
                    val res = NetworkModule.getApiService(url, repository).getGeneric(url + "/api/server-status")
                    if (res.isSuccessful) isPcOnline = res.body()?.get("status") == "online"
                    else isPcOnline = false
                } catch (e: Exception) {
                    isPcOnline = false
                }
            }
            kotlinx.coroutines.delay(5000)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { 
                    Row(verticalAlignment = androidx.compose.ui.Alignment.CenterVertically) {
                        Text(currentPage?.name ?: "Control Pad")
                        Spacer(modifier = Modifier.width(8.dp))
                        Box(modifier = Modifier.size(8.dp).background(if (isPcOnline == true) Color.Green else Color.Red, shape = androidx.compose.foundation.shape.CircleShape))
                    }
                },
                actions = {
                    IconButton(onClick = { isEditMode = !isEditMode }) {
                        Icon(
                            if (isEditMode) Lucide.X else Lucide.Pencil,
                            contentDescription = if (isEditMode) "Exit Edit Mode" else "Enter Edit Mode"
                        )
                    }
                    if (isEditMode) {
                        IconButton(onClick = { showPageManager = true }) {
                            Icon(Lucide.LayoutGrid, contentDescription = "Edit Pages")
                        }
                    } else {
                        IconButton(onClick = { showSettingsDialog = true }) {
                            Icon(Lucide.Settings, contentDescription = "Settings")
                        }
                    }
                },
                colors = TopAppBarDefaults.smallTopAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background
                )
            )
        },
        floatingActionButton = {
            if (isEditMode) {
                FloatingActionButton(onClick = {
                    navController.navigate("edit_block/$currentPageIndex/new")
                }) {
                    Icon(Lucide.Plus, contentDescription = "Add Block")
                }
            }
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .background(MaterialTheme.colorScheme.background)
        ) {
            if (showPageManager && config != null) {
                ManagePagesDialog(
                    config = config!!,
                    repository = repository,
                    onDismiss = { showPageManager = false },
                    onConfigUpdated = { newConfig ->
                        config = newConfig
                        if (currentPageIndex >= newConfig.pages.size) {
                            currentPageIndex = (newConfig.pages.size - 1).coerceAtLeast(0)
                        }
                    }
                )
            }

            if (showSettingsDialog) {
                ServerSettingsDialog(
                    repository = repository,
                    onDismiss = { showSettingsDialog = false },
                    onLogout = { navController.navigate("login") }
                )
            }

            if (loading) {
                CircularProgressIndicator(modifier = Modifier.align(androidx.compose.ui.Alignment.Center))
            } else {
                Column {
                    // Page Selector (Horizontal Scroll)
                    ScrollableTabRow(
                        selectedTabIndex = currentPageIndex,
                        containerColor = Color.Transparent,
                        edgePadding = 16.dp
                    ) {
                        config?.pages?.forEachIndexed { index, page ->
                            Tab(
                                selected = currentPageIndex == index,
                                onClick = { currentPageIndex = index },
                                text = { Text(page.name) }
                            )
                        }
                    }

                    // Blocks List
                    LazyColumn(
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(currentPage?.blocks ?: emptyList()) { block ->
                            ControlBlockItem(
                                block = block,
                                repository = repository,
                                isEditMode = isEditMode,
                                onClick = { 
                                    if (isEditMode) {
                                        navController.navigate("edit_block/$currentPageIndex/${block.id}")
                                    } else {
                                        executeBlock(block) 
                                    }
                                },
                                onLongClick = {
                                    // Removed logic, as tap to edit is better in edit mode
                                },
                                onMoveUp = {
                                    val blocks = currentPage?.blocks?.toMutableList() ?: return@ControlBlockItem
                                    val i = blocks.indexOf(block)
                                    if (i > 0) {
                                        blocks[i] = blocks[i - 1].also { blocks[i - 1] = blocks[i] }
                                        val newConfig = config?.copy(
                                            pages = config!!.pages.map { p ->
                                                if (p.id == currentPage?.id) p.copy(blocks = blocks) else p
                                            }
                                        )
                                        config = newConfig
                                        scope.launch {
                                            val url = repository.serverUrl.first() ?: return@launch
                                            NetworkModule.getApiService(url, repository).saveConfig(newConfig!!)
                                        }
                                    }
                                },
                                onMoveDown = {
                                    val blocks = currentPage?.blocks?.toMutableList() ?: return@ControlBlockItem
                                    val i = blocks.indexOf(block)
                                    if (i < blocks.size - 1) {
                                        blocks[i] = blocks[i + 1].also { blocks[i + 1] = blocks[i] }
                                        val newConfig = config?.copy(
                                            pages = config!!.pages.map { p ->
                                                if (p.id == currentPage?.id) p.copy(blocks = blocks) else p
                                            }
                                        )
                                        config = newConfig
                                        scope.launch {
                                            val url = repository.serverUrl.first() ?: return@launch
                                            NetworkModule.getApiService(url, repository).saveConfig(newConfig!!)
                                        }
                                    }
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}
