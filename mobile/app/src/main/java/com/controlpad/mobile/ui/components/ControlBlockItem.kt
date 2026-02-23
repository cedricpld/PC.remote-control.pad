package com.controlpad.mobile.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
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

// Map string icon names to Material Icons
fun getIconByName(name: String?): ImageVector {
    return when (name?.lowercase()) {
        "monitor" -> Icons.Default.Monitor
        "cpu" -> Icons.Default.Memory
        "activity" -> Icons.Default.ShowChart
        "volume2" -> Icons.Default.VolumeUp
        "mic" -> Icons.Default.Mic
        "micoff" -> Icons.Default.MicOff
        "video" -> Icons.Default.Videocam
        "videooff" -> Icons.Default.VideocamOff
        "power" -> Icons.Default.PowerSettingsNew
        "command" -> Icons.Default.Terminal
        "keyboard" -> Icons.Default.Keyboard
        "sun" -> Icons.Default.WbSunny
        "moon" -> Icons.Default.Nightlight
        "lightbulb" -> Icons.Default.Lightbulb
        "battery" -> Icons.Default.BatteryFull
        "wifi" -> Icons.Default.Wifi
        "music" -> Icons.Default.MusicNote
        "play" -> Icons.Default.PlayArrow
        "pause" -> Icons.Default.Pause
        "skipforward" -> Icons.Default.SkipNext
        "skipback" -> Icons.Default.SkipPrevious
        "settings" -> Icons.Default.Settings
        "home" -> Icons.Default.Home
        else -> Icons.Default.Apps // Fallback
    }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun ControlBlockItem(
    block: ControlBlock,
    repository: SettingsRepository,
    onClick: () -> Unit,
    onLongClick: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    // Determine color
    val blockColor = try {
        if (!block.color.isNullOrEmpty()) Color(android.graphics.Color.parseColor(block.color))
        else MaterialTheme.colorScheme.primary
    } catch (e: Exception) {
        MaterialTheme.colorScheme.primary
    }

    when (block.actionType) {
        "slider" -> {
             // For sliders, long click on the container to edit
             // SliderBlock handles its own internal interaction, so we might wrap it
             Box(modifier = modifier.combinedClickable(onClick = {}, onLongClick = onLongClick)) {
                 SliderBlock(block = block, repository = repository)
             }
        }
        "statusDisplay" -> {
             Box(modifier = modifier.combinedClickable(onClick = {}, onLongClick = onLongClick)) {
                 StatusBlock(block = block, repository = repository)
             }
        }
        else -> {
             // Standard Button (Command, Shortcut, Yeelight toggle, Audio, WOL)
            GlassBox(
                modifier = modifier
                    .padding(4.dp)
                    .height(80.dp)
                    .fillMaxWidth()
                    .combinedClickable(
                        onClick = onClick,
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
    }
}
