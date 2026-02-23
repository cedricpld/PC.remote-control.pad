package com.controlpad.mobile.data

data class AppConfig(
    val pages: List<Page> = emptyList(),
    val pcServer: PcServerConfig? = null
)

data class Page(
    val id: String,
    val name: String,
    val icon: String = "Activity",
    val color: String = "#000000",
    val blocks: List<ControlBlock> = emptyList()
)

data class ControlBlock(
    val id: String,
    val label: String,
    val icon: String? = null,
    val color: String? = null,
    val width: Int = 1,
    val height: Int = 1,
    val actionType: String, // command, shortcut, yeelight, slider, statusDisplay, audio, wol
    val target: String? = "server",
    val command: String? = null,
    val shortcut: String? = null,
    val yeelightConfig: YeelightConfig? = null,
    val sliderConfig: SliderConfig? = null,
    val statusDisplayConfig: StatusDisplayConfig? = null,
    val wolConfig: WolConfig? = null
)

data class YeelightConfig(
    val ip: String,
    val action: String? = null, // toggle, on, off
    val controlType: String? = null
)

data class SliderConfig(
    val apiEndpoint: String,
    val min: Float,
    val max: Float,
    val initialValue: Float,
    val unit: String
)

data class StatusDisplayConfig(
    val apiEndpoint: String,
    val updateIntervalMs: Long = 2000,
    val labelUnit: String
)

data class WolConfig(
    val mac: String,
    val method: String = "network"
)

data class PcServerConfig(
    val ip: String,
    val port: Int
)

data class AuthResponse(
    val token: String? = null,
    val error: String? = null
)

data class LoginRequest(
    val password: String
)
