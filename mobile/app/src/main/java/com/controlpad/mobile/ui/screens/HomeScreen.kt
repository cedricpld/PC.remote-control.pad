package com.controlpad.mobile.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
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
    var loading by remember { mutableStateOf(true) }
    var showPageManager by remember { mutableStateOf(false) }

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
                val payload = mutableMapOf<String, Any?>("target" to (block.target ?: "server"))

                // Map block props to payload
                if (block.actionType == "command") payload["command"] = block.command
                if (block.actionType == "shortcut") payload["shortcut"] = block.shortcut
                if (block.actionType == "yeelight") {
                    // Logic for specific endpoints or generic execute
                    // Using dedicated endpoints for clarity if needed, or generic execute wrapper
                    if (block.yeelightConfig != null) {
                         // Call specific yeelight endpoint manually or via execute-action wrapper
                         api.postGeneric(url + "/api/yeelight-toggle", mapOf("action" to "toggle", "yeelightIp" to block.yeelightConfig.ip))
                         return@collect
                    }
                }

                try {
                    api.executeAction(payload)
                } catch (e: Exception) {
                    // Toast error
                }
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(currentPage?.name ?: "Control Pad") },
                actions = {
                    IconButton(onClick = { showPageManager = true }) {
                        Icon(Icons.Default.Edit, contentDescription = "Edit Pages")
                    }
                    IconButton(onClick = {
                        scope.launch { repository.clearToken() }
                        navController.navigate("login")
                    }) {
                        Icon(Icons.Default.Settings, contentDescription = "Settings")
                    }
                },
                colors = TopAppBarDefaults.smallTopAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background
                )
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = {
                navController.navigate("edit_block/$currentPageIndex/new")
            }) {
                Icon(Icons.Default.Add, contentDescription = "Add Block")
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
                                onClick = { executeBlock(block) },
                                onLongClick = {
                                    navController.navigate("edit_block/$currentPageIndex/${block.id}")
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}
