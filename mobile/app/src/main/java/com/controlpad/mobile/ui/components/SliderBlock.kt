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
    
    val isYeelight = block.actionType == "yeelight"
    val yeelightControlType = block.yeelightConfig?.controlType

    val sliderMin = if (isYeelight) 1f else block.sliderConfig?.min ?: 0f
    val sliderMax = if (isYeelight) {
        when(yeelightControlType) {
            "brightness_slider" -> 100f
            "color_temperature_slider" -> 6500f
            "hue_slider" -> 359f
            else -> 100f
        }
    } else block.sliderConfig?.max ?: 100f

    val sliderUnit = if (isYeelight) {
         when(yeelightControlType) {
            "brightness_slider" -> "%"
            "color_temperature_slider" -> "K"
            "hue_slider" -> "°"
            else -> "%"
        }
    } else block.sliderConfig?.unit ?: "%"

    var value by remember { mutableStateOf(if (isYeelight) sliderMin else block.sliderConfig?.initialValue ?: sliderMin) }

    val updateValue = { newValue: Float ->
        scope.launch {
            val url = repository.serverUrl.first() ?: return@launch
            val api = NetworkModule.getApiService(url, repository)

            try {
                if (isYeelight && block.yeelightConfig != null) {
                    val endpoint = when(yeelightControlType) {
                        "brightness_slider" -> "/api/yeelight-brightness"
                        "color_temperature_slider" -> "/api/yeelight-color-temp"
                        "hue_slider" -> "/api/yeelight-hue"
                        else -> return@launch
                    }
                    val payload = mutableMapOf<String, Any>("yeelightIp" to block.yeelightConfig.ip)
                    when(yeelightControlType) {
                        "brightness_slider" -> payload["brightness"] = newValue.toInt()
                        "color_temperature_slider" -> payload["colorTemp"] = newValue.toInt()
                        "hue_slider" -> payload["hue"] = newValue.toInt()
                    }
                    api.postGeneric("$url$endpoint", payload)

                } else if (block.sliderConfig != null) {
                    val endpoint = if (block.sliderConfig.apiEndpoint.startsWith("/")) block.sliderConfig.apiEndpoint else "/${block.sliderConfig.apiEndpoint}"
                    val finalUrl = if (url.endsWith("/")) "${url.dropLast(1)}$endpoint" else "$url$endpoint"

                    // Volume slider uses 0-65535 and typically requires an integer.
                    val payloadValue = if (block.sliderConfig.max == 65535f) {
                        newValue.toInt() 
                    } else {
                        newValue
                    }

                    api.postGeneric(finalUrl, mapOf("value" to payloadValue))
                }
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
                val displayedValue = if (block.sliderConfig?.max == 65535f && sliderUnit == "%") {
                    ((value / 65535f) * 100).toInt()
                } else {
                    value.toInt()
                }
                Text(text = "${displayedValue}${sliderUnit}", color = Color.White.copy(alpha = 0.7f), fontSize = 12.sp)
            }

            Slider(
                value = value,
                onValueChange = { value = it },
                onValueChangeFinished = { updateValue(value) },
                valueRange = sliderMin..sliderMax,
                colors = SliderDefaults.colors(
                    thumbColor = MaterialTheme.colorScheme.primary,
                    activeTrackColor = MaterialTheme.colorScheme.primary,
                    inactiveTrackColor = Color.White.copy(alpha = 0.3f)
                )
            )
        }
    }
}
