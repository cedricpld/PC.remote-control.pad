package com.controlpad.mobile.data

data class AppConfig(
    val pages: List<Page> = emptyList(),
    val pcServer: PcServerConfig? = null,
    val auth: AuthConfig? = null,
    val xiaomiUrl: String? = null
)

data class AuthConfig(
    val hashedPassword: String? = null
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
    val command: String? = "",
    val shortcut: String? = "",
    val yeelightConfig: YeelightConfig? = YeelightConfig("", "toggle", ""),
    val sliderConfig: SliderConfig? = SliderConfig("", 0f, 100f, 50f, ""),
    val statusDisplayConfig: StatusDisplayConfig? = StatusDisplayConfig("", 2000, ""),
    val wolConfig: WolConfig? = WolConfig(""),
    val audioConfig: AudioConfig? = AudioConfig("")
)

data class AudioConfig(
    val action: String? = null
)

data class YeelightConfig(
    val ip: String = "",
    val action: String? = "toggle", // toggle, on, off
    val controlType: String? = ""
)

data class SliderConfig(
    val apiEndpoint: String = "",
    val min: Float = 0f,
    val max: Float = 100f,
    val initialValue: Float = 50f,
    val unit: String = ""
)

data class StatusDisplayConfig(
    val apiEndpoint: String = "",
    val updateIntervalMs: Long = 2000,
    val labelUnit: String = ""
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
