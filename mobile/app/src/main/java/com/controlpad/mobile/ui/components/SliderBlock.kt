package com.controlpad.mobile.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
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
import kotlinx.coroutines.launch
import kotlinx.coroutines.flow.first

@Composable
fun SliderBlock(
    block: ControlBlock,
    repository: SettingsRepository
) {
    val scope = rememberCoroutineScope()
    val sliderConfig = block.sliderConfig ?: return

    var value by remember { mutableStateOf(sliderConfig.initialValue) }

    // Debounce or just fire on change?
    // For simplicity, fire on change finished or throttle.
    // Compose Slider has onValueChangeFinished.

    val updateValue = { newValue: Float ->
        scope.launch {
            val url = repository.serverUrl.first() ?: return@launch
            val api = NetworkModule.getApiService(url, repository)

            try {
                // Determine endpoint: generic or specific
                val endpoint = if (sliderConfig.apiEndpoint.startsWith("/")) sliderConfig.apiEndpoint else "/${sliderConfig.apiEndpoint}"
                val finalUrl = if (url.endsWith("/")) "${url.dropLast(1)}$endpoint" else "$url$endpoint"

                // Most slider endpoints expect { value: number }
                api.postGeneric(finalUrl, mapOf("value" to newValue))
            } catch (e: Exception) {
                // ignore
            }
        }
    }

    GlassBox(
        modifier = Modifier
            .padding(4.dp)
            .height(100.dp)
            .fillMaxWidth()
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(12.dp),
            verticalArrangement = Arrangement.Center
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(text = block.label, color = Color.White, fontSize = 14.sp)
                Text(text = "${value.toInt()}${sliderConfig.unit}", color = Color.White.copy(alpha = 0.7f), fontSize = 12.sp)
            }

            Slider(
                value = value,
                onValueChange = { value = it },
                onValueChangeFinished = { updateValue(value) },
                valueRange = sliderConfig.min..sliderConfig.max,
                colors = SliderDefaults.colors(
                    thumbColor = MaterialTheme.colorScheme.primary,
                    activeTrackColor = MaterialTheme.colorScheme.primary,
                    inactiveTrackColor = Color.White.copy(alpha = 0.3f)
                )
            )
        }
    }
}
