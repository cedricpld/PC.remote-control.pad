package com.controlpad.mobile.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.controlpad.mobile.data.*
import kotlinx.coroutines.launch
import kotlinx.coroutines.flow.first

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EditBlockScreen(
    navController: NavController,
    repository: SettingsRepository,
    blockId: String?,
    pageIndex: Int
) {
    val scope = rememberCoroutineScope()
    var config by remember { mutableStateOf<AppConfig?>(null) }

    // Core Props
    var label by remember { mutableStateOf("") }
    var type by remember { mutableStateOf("command") }
    var command by remember { mutableStateOf("") }
    var icon by remember { mutableStateOf("") }
    var color by remember { mutableStateOf("") }
    var shortcut by remember { mutableStateOf("") }
    var target by remember { mutableStateOf("server") }

    // Nested Props
    var yeelightIp by remember { mutableStateOf("") }
    var yeelightAction by remember { mutableStateOf("toggle") }

    var sliderEndpoint by remember { mutableStateOf("") }
    var sliderMin by remember { mutableStateOf("0") }
    var sliderMax by remember { mutableStateOf("100") }
    var sliderUnit by remember { mutableStateOf("%") }

    var statusEndpoint by remember { mutableStateOf("") }
    var statusInterval by remember { mutableStateOf("2000") }
    var statusUnit by remember { mutableStateOf("") }

    var wolMac by remember { mutableStateOf("") }

    // Load existing data
    LaunchedEffect(Unit) {
        val url = repository.serverUrl.first() ?: return@LaunchedEffect
        val api = NetworkModule.getApiService(url, repository)
        val res = api.getConfig()
        if (res.isSuccessful) {
            config = res.body()
            if (blockId != null && blockId != "new") {
                val found = config?.pages?.getOrNull(pageIndex)?.blocks?.find { it.id == blockId }
                if (found != null) {
                    label = found.label
                    type = found.actionType
                    command = found.command ?: ""
                    icon = found.icon ?: ""
                    color = found.color ?: ""
                    shortcut = found.shortcut ?: ""
                    target = found.target ?: "server"

                    found.yeelightConfig?.let {
                        yeelightIp = it.ip
                        yeelightAction = it.action ?: "toggle"
                    }
                    found.sliderConfig?.let {
                        sliderEndpoint = it.apiEndpoint
                        sliderMin = it.min.toString()
                        sliderMax = it.max.toString()
                        sliderUnit = it.unit
                    }
                    found.statusDisplayConfig?.let {
                        statusEndpoint = it.apiEndpoint
                        statusInterval = it.updateIntervalMs.toString()
                        statusUnit = it.labelUnit
                    }
                    found.wolConfig?.let {
                        wolMac = it.mac
                    }
                }
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(if (blockId == "new") "New Block" else "Edit Block") },
                colors = TopAppBarDefaults.smallTopAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background
                )
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState())
        ) {
            Text("General", style = MaterialTheme.typography.titleMedium)
            Spacer(modifier = Modifier.height(8.dp))

            OutlinedTextField(
                value = label,
                onValueChange = { label = it },
                label = { Text("Label") },
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(modifier = Modifier.height(8.dp))

            // Type Selector
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                // Simplified dropdown via radio or just text for now to save space
                 OutlinedTextField(
                    value = type,
                    onValueChange = { type = it },
                    label = { Text("Type (command, slider, statusDisplay, yeelight, wol, shortcut)") },
                    modifier = Modifier.fillMaxWidth()
                )
            }
            Spacer(modifier = Modifier.height(8.dp))

            OutlinedTextField(
                value = icon,
                onValueChange = { icon = it },
                label = { Text("Icon Name (e.g. Activity, Sun)") },
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(modifier = Modifier.height(8.dp))
             OutlinedTextField(
                value = color,
                onValueChange = { color = it },
                label = { Text("Color Hex") },
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(modifier = Modifier.height(8.dp))
             OutlinedTextField(
                value = target,
                onValueChange = { target = it },
                label = { Text("Target (server/client)") },
                modifier = Modifier.fillMaxWidth()
            )

            // Conditional Fields
            if (type == "command") {
                Spacer(modifier = Modifier.height(16.dp))
                Text("Command Settings", style = MaterialTheme.typography.titleMedium)
                OutlinedTextField(
                    value = command,
                    onValueChange = { command = it },
                    label = { Text("Command") },
                    modifier = Modifier.fillMaxWidth()
                )
            }

            if (type == "shortcut") {
                Spacer(modifier = Modifier.height(16.dp))
                Text("Shortcut Settings", style = MaterialTheme.typography.titleMedium)
                OutlinedTextField(
                    value = shortcut,
                    onValueChange = { shortcut = it },
                    label = { Text("Shortcut Key") },
                    modifier = Modifier.fillMaxWidth()
                )
            }

            if (type == "yeelight") {
                Spacer(modifier = Modifier.height(16.dp))
                Text("Yeelight Settings", style = MaterialTheme.typography.titleMedium)
                OutlinedTextField(
                    value = yeelightIp,
                    onValueChange = { yeelightIp = it },
                    label = { Text("IP Address") },
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = yeelightAction,
                    onValueChange = { yeelightAction = it },
                    label = { Text("Action (toggle, on, off)") },
                    modifier = Modifier.fillMaxWidth()
                )
            }

            if (type == "slider") {
                Spacer(modifier = Modifier.height(16.dp))
                Text("Slider Settings", style = MaterialTheme.typography.titleMedium)
                OutlinedTextField(
                    value = sliderEndpoint,
                    onValueChange = { sliderEndpoint = it },
                    label = { Text("API Endpoint") },
                    modifier = Modifier.fillMaxWidth()
                )
                Row(modifier = Modifier.fillMaxWidth()) {
                    OutlinedTextField(
                        value = sliderMin,
                        onValueChange = { sliderMin = it },
                        label = { Text("Min") },
                        modifier = Modifier.weight(1f)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    OutlinedTextField(
                        value = sliderMax,
                        onValueChange = { sliderMax = it },
                        label = { Text("Max") },
                        modifier = Modifier.weight(1f)
                    )
                }
                OutlinedTextField(
                    value = sliderUnit,
                    onValueChange = { sliderUnit = it },
                    label = { Text("Unit") },
                    modifier = Modifier.fillMaxWidth()
                )
            }

            if (type == "statusDisplay") {
                Spacer(modifier = Modifier.height(16.dp))
                Text("Status Settings", style = MaterialTheme.typography.titleMedium)
                OutlinedTextField(
                    value = statusEndpoint,
                    onValueChange = { statusEndpoint = it },
                    label = { Text("API Endpoint") },
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = statusInterval,
                    onValueChange = { statusInterval = it },
                    label = { Text("Interval (ms)") },
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = statusUnit,
                    onValueChange = { statusUnit = it },
                    label = { Text("Unit") },
                    modifier = Modifier.fillMaxWidth()
                )
            }

            if (type == "wol") {
                Spacer(modifier = Modifier.height(16.dp))
                Text("WOL Settings", style = MaterialTheme.typography.titleMedium)
                OutlinedTextField(
                    value = wolMac,
                    onValueChange = { wolMac = it },
                    label = { Text("MAC Address") },
                    modifier = Modifier.fillMaxWidth()
                )
            }

            Spacer(modifier = Modifier.height(24.dp))
            Button(
                onClick = {
                    scope.launch {
                        if (config == null) return@launch

                        // Construct Nested Configs
                        val yeelightConfig = if (type == "yeelight") YeelightConfig(yeelightIp, yeelightAction) else null
                        val sliderConfig = if (type == "slider") SliderConfig(
                            sliderEndpoint,
                            sliderMin.toFloatOrNull() ?: 0f,
                            sliderMax.toFloatOrNull() ?: 100f,
                            sliderMin.toFloatOrNull() ?: 0f,
                            sliderUnit
                        ) else null
                        val statusConfig = if (type == "statusDisplay") StatusDisplayConfig(
                            statusEndpoint,
                            statusInterval.toLongOrNull() ?: 2000L,
                            statusUnit
                        ) else null
                        val wolConfig = if (type == "wol") WolConfig(wolMac) else null

                        val newBlock = ControlBlock(
                            id = blockId?.takeIf { it != "new" } ?: java.util.UUID.randomUUID().toString(),
                            label = label,
                            actionType = type,
                            command = command.ifEmpty { null },
                            shortcut = shortcut.ifEmpty { null },
                            icon = icon.ifEmpty { null },
                            color = color.ifEmpty { null },
                            target = target,
                            yeelightConfig = yeelightConfig,
                            sliderConfig = sliderConfig,
                            statusDisplayConfig = statusConfig,
                            wolConfig = wolConfig
                        )

                        val pages = config!!.pages.toMutableList()
                        val page = pages[pageIndex]
                        val blocks = page.blocks.toMutableList()

                        if (blockId == "new") {
                            blocks.add(newBlock)
                        } else {
                            val idx = blocks.indexOfFirst { it.id == blockId }
                            if (idx != -1) blocks[idx] = newBlock
                        }

                        pages[pageIndex] = page.copy(blocks = blocks)
                        val newConfig = config!!.copy(pages = pages)

                        val url = repository.serverUrl.first() ?: return@launch
                        val api = NetworkModule.getApiService(url, repository)
                        api.saveConfig(newConfig)
                        navController.popBackStack()
                    }
                },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Save")
            }

            if (blockId != "new") {
                Spacer(modifier = Modifier.height(8.dp))
                Button(
                    onClick = {
                        scope.launch {
                            if (config == null) return@launch
                            val pages = config!!.pages.toMutableList()
                            val page = pages[pageIndex]
                            val blocks = page.blocks.toMutableList()
                            blocks.removeAll { it.id == blockId }
                            pages[pageIndex] = page.copy(blocks = blocks)
                            val newConfig = config!!.copy(pages = pages)

                            val url = repository.serverUrl.first() ?: return@launch
                            val api = NetworkModule.getApiService(url, repository)
                            api.saveConfig(newConfig)
                            navController.popBackStack()
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Delete")
                }
            }
        }
    }
}
