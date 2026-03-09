package com.controlpad.mobile.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.IconButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.controlpad.mobile.data.ControlBlock
import com.controlpad.mobile.data.SettingsRepository
import com.composables.icons.lucide.Lucide
import com.composables.icons.lucide.*
fun getIconByName(name: String?): ImageVector {
    return when (name) {
        "Monitor" -> Lucide.Monitor
        "Gamepad2" -> Lucide.Gamepad2
        "Volume2" -> Lucide.Volume2
        "Mic" -> Lucide.Mic
        "Camera" -> Lucide.Camera
        "Lightbulb" -> Lucide.Lightbulb
        "Wifi" -> Lucide.Wifi
        "Settings" -> Lucide.Settings
        "Play" -> Lucide.Play
        "Pause" -> Lucide.Pause
        "Square" -> Lucide.Square
        "SkipForward" -> Lucide.SkipForward
        "SkipBack" -> Lucide.SkipBack
        "Home" -> Lucide.House
        "Folder" -> Lucide.Folder
        "Terminal" -> Lucide.Terminal
        "Cpu" -> Lucide.Cpu
        "MemoryStick" -> Lucide.MemoryStick
        "Power" -> Lucide.Power
        "Thermometer" -> Lucide.Thermometer
        "Droplets" -> Lucide.Droplets
        "Battery" -> Lucide.Battery
        "Undo2" -> Lucide.Undo2
        "MonitorX" -> Lucide.MonitorX
        "SquareDashed" -> Lucide.SquareDashedMousePointer
        "Moon" -> Lucide.Moon
        "Eclipse" -> Lucide.Eclipse
        "TrafficCone" -> Lucide.TrafficCone
        "ChevronRight" -> Lucide.ChevronRight
        "GlobeLock" -> Lucide.GlobeLock
        "ScreenShare" -> Lucide.ScreenShare
        "Ban" -> Lucide.Ban
        "LayoutGrid" -> Lucide.LayoutGrid
        "Volume" -> Lucide.Volume
        "Sun" -> Lucide.Sun
        "ToggleLeft" -> Lucide.ToggleLeft
        "PowerOff" -> Lucide.PowerOff
        "Palette" -> Lucide.Palette
        "Rainbow" -> Lucide.Rainbow
        "Server" -> Lucide.Server
        "Database" -> Lucide.Database
        "Network" -> Lucide.Network
        else -> Lucide.LayoutGrid // Fallback
    }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun ControlBlockItem(
    block: ControlBlock,
    repository: SettingsRepository,
    isEditMode: Boolean = false,
    onClick: () -> Unit,
    onLongClick: () -> Unit = {},
    onMoveUp: (() -> Unit)? = null,
    onMoveDown: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    // Determine color
    val defaultColor = MaterialTheme.colorScheme.primary
    val blockColor = try {
        if (!block.color.isNullOrEmpty()) Color(android.graphics.Color.parseColor(block.color))
        else defaultColor
    } catch (e: Exception) {
        defaultColor
    }

    Box(modifier = modifier) {
        if (block.actionType == "slider" || (block.actionType == "yeelight" && block.yeelightConfig?.controlType?.contains("slider") == true)) {
            Box(modifier = Modifier.combinedClickable(onClick = { if (!isEditMode) onClick() }, onLongClick = onLongClick)) {
                SliderBlock(block = block, repository = repository)
            }
        } else if (block.actionType == "statusDisplay") {
            Box(modifier = Modifier.combinedClickable(onClick = { if (!isEditMode) onClick() }, onLongClick = onLongClick)) {
                StatusBlock(block = block, repository = repository)
            }
        } else {
            // Standard Button (Command, Shortcut, Yeelight toggle, Audio, WOL)
            GlassBox(
                modifier = Modifier
                    .padding(4.dp)
                    .height(80.dp)
                    .fillMaxWidth()
                    .combinedClickable(
                        onClick = { if (!isEditMode) onClick() },
                        onLongClick = onLongClick
                    ),
                backgroundColor = blockColor.copy(alpha = 0.8f)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = getIconByName(block.icon),
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(32.dp)
                    )
                    Spacer(modifier = Modifier.width(16.dp))
                    Column {
                        Text(
                            text = block.label,
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        Text(
                            text = block.actionType.uppercase(),
                            color = Color.White.copy(alpha = 0.7f),
                            fontSize = 10.sp
                        )
                    }
                }
            }
        }
        if (isEditMode) {
            Box(
                modifier = Modifier
                    .matchParentSize()
                    .background(Color.Black.copy(alpha = 0.3f))
                    .combinedClickable(onClick = onClick)
            ) {
                 Row(modifier = Modifier.align(Alignment.CenterEnd).padding(end = 16.dp)) {
                    IconButton(onClick = { onMoveUp?.invoke() }) {
                        Icon(Lucide.ArrowUp, contentDescription = "Up", tint = Color.White)
                    }
                    IconButton(onClick = { onMoveDown?.invoke() }) {
                        Icon(Lucide.ArrowDown, contentDescription = "Down", tint = Color.White)
                    }
                 }
            }
        }
    }
}
