package com.controlpad.mobile.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.controlpad.mobile.data.ControlBlock
import com.controlpad.mobile.data.NetworkModule
import com.controlpad.mobile.data.SettingsRepository
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

@Composable
fun StatusBlock(
    block: ControlBlock,
    repository: SettingsRepository
) {
    val statusConfig = block.statusDisplayConfig ?: return
    var value by remember { mutableStateOf<Any?>("--") }

    LaunchedEffect(block) {
        while (isActive) {
            val url = repository.serverUrl.first()
            if (url != null) {
                try {
                    val api = NetworkModule.getApiService(url, repository)
                    val endpoint = if (statusConfig.apiEndpoint.startsWith("/")) statusConfig.apiEndpoint else "/${statusConfig.apiEndpoint}"
                    val finalUrl = if (url.endsWith("/")) "${url.dropLast(1)}$endpoint" else "$url$endpoint"

                    val res = api.getGeneric(finalUrl)
                    if (res.isSuccessful && res.body() != null) {
                        value = res.body()!!["value"] ?: "--"
                    }
                } catch (e: Exception) {
                    value = "Err"
                }
            }
            delay(statusConfig.updateIntervalMs)
        }
    }

    // Try to parse number for progress bar
    val numValue = try {
        value.toString().toFloatOrNull()
    } catch (e: Exception) { null }

    val isPercent = statusConfig.labelUnit == "%"

    GlassBox(
        modifier = Modifier
            .padding(4.dp)
            .height(80.dp)
            .fillMaxWidth()
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.Center
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(text = block.label, color = Color.White.copy(alpha = 0.7f), fontSize = 12.sp)
                Text(
                    text = "${if (numValue != null) String.format("%.1f", numValue) else value}${statusConfig.labelUnit}",
                    color = Color.White,
                    fontSize = 18.sp,
                    style = MaterialTheme.typography.titleMedium
                )
            }

            if (isPercent && numValue != null) {
                Spacer(modifier = Modifier.height(8.dp))
                LinearProgressIndicator(
                    progress = (numValue / 100f).coerceIn(0f, 1f),
                    modifier = Modifier.fillMaxWidth().height(4.dp),
                    color = if (numValue > 80) Color.Red else MaterialTheme.colorScheme.primary,
                    trackColor = Color.White.copy(alpha = 0.1f)
                )
            }
        }
    }
}
