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
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppDropdown(
    label: String,
    value: String,
    options: List<Pair<String, String>>,
    onValueChange: (String) -> Unit
) {
    var expanded by remember { mutableStateOf(false) }
    ExposedDropdownMenuBox(
        expanded = expanded,
        onExpandedChange = { expanded = !expanded }
    ) {
        OutlinedTextField(
            value = options.find { it.first == value }?.second ?: value,
            onValueChange = {},
            readOnly = true,
            label = { Text(label) },
            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
            modifier = Modifier.menuAnchor().fillMaxWidth()
        )
        ExposedDropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false }
        ) {
            options.forEach { (optionValue, optionLabel) ->
                DropdownMenuItem(
                    text = { Text(optionLabel) },
                    onClick = {
                        onValueChange(optionValue)
                        expanded = false
                    }
                )
            }
        }
    }
}

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
    var icon by remember { mutableStateOf("Monitor") }
    var color by remember { mutableStateOf("#3b82f6") }
    var width by remember { mutableStateOf("1") }
    var height by remember { mutableStateOf("1") }
    var shortcut by remember { mutableStateOf("") }
    var target by remember { mutableStateOf("server") }

    // Nested Props
    var yeelightIp by remember { mutableStateOf("") }
    var yeelightAction by remember { mutableStateOf("toggle") }
    var yeelightType by remember { mutableStateOf("button") }

    var sliderEndpoint by remember { mutableStateOf("") }
    var sliderMin by remember { mutableStateOf("0") }
    var sliderMax by remember { mutableStateOf("100") }
    var sliderUnit by remember { mutableStateOf("%") }

    var statusEndpoint by remember { mutableStateOf("") }
    var statusInterval by remember { mutableStateOf("2000") }
    var statusUnit by remember { mutableStateOf("") }

    var wolMac by remember { mutableStateOf("") }
    var wolMethod by remember { mutableStateOf("network") }

    var audioAction by remember { mutableStateOf("stopAll") }

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
                    icon = found.icon ?: "Monitor"
                    color = found.color ?: "#3b82f6"
                    width = found.width.toString()
                    height = found.height.toString()
                    shortcut = found.shortcut ?: ""
                    target = found.target ?: "server"

                    found.yeelightConfig?.let {
                        yeelightIp = it.ip
                        yeelightAction = it.action ?: "toggle"
                        yeelightType = if (it.controlType?.contains("slider") == true) "slider" else "button"
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
                        wolMethod = it.method
                    }
                    found.audioConfig?.let {
                        audioAction = it.action ?: "stopAll"
                    }
                }
            }
        }
    }

    val iconOptions = listOf(
        "Monitor" to "Monitor", "Gamepad2" to "Gaming", "Volume2" to "Volume", "Mic" to "Microphone", 
        "Camera" to "Camera", "Lightbulb" to "Light", "Wifi" to "WiFi", "Settings" to "Settings",
        "Play" to "Play", "Pause" to "Pause", "Square" to "Stop", "SkipForward" to "Next",
        "SkipBack" to "Previous", "Home" to "Home", "Folder" to "Folder", "Terminal" to "Terminal",
        "Cpu" to "CPU", "MemoryStick" to "RAM", "Power" to "Power", "Thermometer" to "Temp",
        "Droplets" to "Humidity", "Battery" to "Battery", "Undo2" to "Undo", "MonitorX" to "Monitor Off",
        "SquareDashed" to "Select All", "Moon" to "Sleep", "Eclipse" to "Deep Sleep", "TrafficCone" to "VLC",
        "ChevronRight" to "Plex", "GlobeLock" to "VPN", "ScreenShare" to "Remote", "Ban" to "Stop App",
        "LayoutGrid" to "Apps", "Volume" to "Mute", "Sun" to "Brightness", "ToggleLeft" to "Switch",
        "PowerOff" to "Power Off", "Palette" to "Color", "Rainbow" to "Hue", "Server" to "Server",
        "Database" to "Database", "Network" to "Network"
    )

    val colorOptions = listOf(
        "#3b82f6" to "Blue", "#ef4444" to "Red", "#22c55e" to "Green", "#f97316" to "Orange",
        "#8b5cf6" to "Purple", "#eab308" to "Yellow", "#ec4899" to "Pink", "#6b7280" to "Gray",
        "#fcfcfc" to "White", "#1fc7ff" to "Cyan", "#281fff" to "Blue Dark", "#ff0000" to "Pure Red"
    )

    val typeOptions = listOf(
        "command" to "Command", "shortcut" to "Shortcut", "yeelight" to "Yeelight",
        "slider" to "Slider", "statusDisplay" to "Status Display", "audio" to "Audio", "wol" to "Wake On LAN"
    )

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

            AppDropdown("Icon", icon, iconOptions) { icon = it }
            Spacer(modifier = Modifier.height(8.dp))

            AppDropdown("Color", color, colorOptions) { color = it }
            Spacer(modifier = Modifier.height(8.dp))

            AppDropdown("Type", type, typeOptions) { type = it }
            Spacer(modifier = Modifier.height(16.dp))

            if (type == "command" || type == "audio") {
                Text("Execution Target", style = MaterialTheme.typography.titleMedium)
                Row(verticalAlignment = androidx.compose.ui.Alignment.CenterVertically) {
                    Text("Client", color = if (target == "client") MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface)
                    Switch(checked = target == "server", onCheckedChange = { target = if (it) "server" else "client" }, modifier = Modifier.padding(horizontal = 8.dp))
                    Text("Server", color = if (target == "server") MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface)
                }
                Spacer(modifier = Modifier.height(8.dp))
            }

            // Conditional Fields
            if (type == "command") {
                Text("Command Settings", style = MaterialTheme.typography.titleMedium)
                OutlinedTextField(value = command, onValueChange = { command = it }, label = { Text("Command") }, modifier = Modifier.fillMaxWidth(), minLines = 3)
            }

            if (type == "shortcut") {
                Text("Shortcut Settings", style = MaterialTheme.typography.titleMedium)
                OutlinedTextField(value = shortcut, onValueChange = { shortcut = it }, label = { Text("Shortcut Key") }, modifier = Modifier.fillMaxWidth())
            }

            if (type == "yeelight") {
                Text("Yeelight Settings", style = MaterialTheme.typography.titleMedium)
                OutlinedTextField(value = yeelightIp, onValueChange = { yeelightIp = it }, label = { Text("Bulb IP Address") }, modifier = Modifier.fillMaxWidth())
                AppDropdown("Type", yeelightType, listOf("button" to "Button", "slider" to "Slider")) { yeelightType = it }
                if (yeelightType == "slider") {
                    AppDropdown("Slider Action", yeelightAction, listOf("brightness_slider" to "Brightness", "color_temperature_slider" to "Temperature", "hue_slider" to "Hue")) { yeelightAction = it }
                } else {
                    AppDropdown("Button Action", yeelightAction, listOf("toggle" to "Toggle", "on" to "On", "off" to "Off")) { yeelightAction = it }
                }
            }

            if (type == "slider") {
                Text("Slider Settings", style = MaterialTheme.typography.titleMedium)
                OutlinedTextField(value = sliderEndpoint, onValueChange = { sliderEndpoint = it }, label = { Text("API Endpoint") }, modifier = Modifier.fillMaxWidth())
                Row(modifier = Modifier.fillMaxWidth()) {
                    OutlinedTextField(value = sliderMin, onValueChange = { sliderMin = it }, label = { Text("Min") }, modifier = Modifier.weight(1f))
                    Spacer(modifier = Modifier.width(8.dp))
                    OutlinedTextField(value = sliderMax, onValueChange = { sliderMax = it }, label = { Text("Max") }, modifier = Modifier.weight(1f))
                }
                OutlinedTextField(value = sliderUnit, onValueChange = { sliderUnit = it }, label = { Text("Unit (e.g. %)") }, modifier = Modifier.fillMaxWidth())
            }

            if (type == "statusDisplay") {
                Text("Status Settings", style = MaterialTheme.typography.titleMedium)
                OutlinedTextField(value = statusEndpoint, onValueChange = { statusEndpoint = it }, label = { Text("API Endpoint") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = statusInterval, onValueChange = { statusInterval = it }, label = { Text("Interval (ms)") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = statusUnit, onValueChange = { statusUnit = it }, label = { Text("Label Unit") }, modifier = Modifier.fillMaxWidth())
            }

            if (type == "wol") {
                Text("WOL Settings", style = MaterialTheme.typography.titleMedium)
                OutlinedTextField(value = wolMac, onValueChange = { wolMac = it }, label = { Text("MAC Address") }, modifier = Modifier.fillMaxWidth())
                AppDropdown("Method", wolMethod, listOf("network" to "Network (WiFi/Broadcast)", "etherwake" to "Ethernet (Etherwake)")) { wolMethod = it }
            }

            if (type == "audio") {
                Text("Audio Settings", style = MaterialTheme.typography.titleMedium)
                AppDropdown("Action", audioAction, listOf("stopAll" to "Stop All Sounds", "play" to "Play Sound", "stop" to "Stop Current Sound")) { audioAction = it }
            }

            Spacer(modifier = Modifier.height(24.dp))
            Button(
                onClick = {
                    scope.launch {
                        if (config == null) return@launch

                        val yeelightConfig = if (type == "yeelight") YeelightConfig(yeelightIp, yeelightAction, yeelightType) else null
                        val sliderConfig = if (type == "slider") SliderConfig(sliderEndpoint, sliderMin.toFloatOrNull() ?: 0f, sliderMax.toFloatOrNull() ?: 100f, sliderMin.toFloatOrNull() ?: 0f, sliderUnit) else null
                        val statusConfig = if (type == "statusDisplay") StatusDisplayConfig(statusEndpoint, statusInterval.toLongOrNull() ?: 2000L, statusUnit) else null
                        val wolConfigToSave = if (type == "wol") WolConfig(wolMac, wolMethod) else null
                        val audioConfigToSave = if (type == "audio") AudioConfig(audioAction) else null

                        val newBlock = ControlBlock(
                            id = blockId?.takeIf { it != "new" } ?: java.util.UUID.randomUUID().toString(),
                            label = label,
                            actionType = type,
                            command = command.ifEmpty { null },
                            shortcut = shortcut.ifEmpty { null },
                            icon = icon.ifEmpty { null },
                            color = color.ifEmpty { null },
                            width = width.toIntOrNull() ?: 1,
                            height = height.toIntOrNull() ?: 1,
                            target = target,
                            yeelightConfig = yeelightConfig,
                            sliderConfig = sliderConfig,
                            statusDisplayConfig = statusConfig,
                            wolConfig = wolConfigToSave,
                            audioConfig = audioConfigToSave
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
                            NetworkModule.getApiService(url, repository).saveConfig(newConfig)
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
