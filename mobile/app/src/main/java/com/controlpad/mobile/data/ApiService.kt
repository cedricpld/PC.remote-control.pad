package com.controlpad.mobile.data

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

interface ApiService {
    @POST("/api/login")
    suspend fun login(@Body request: LoginRequest): Response<AuthResponse>

    @GET("/api/config")
    suspend fun getConfig(): Response<AppConfig>

    @POST("/api/config")
    suspend fun saveConfig(@Body config: AppConfig): Response<Any>

    @POST("/api/execute-action")
    suspend fun executeAction(@Body block: ControlBlock): Response<Any>

    // Generic
    @GET
    suspend fun getGeneric(@retrofit2.http.Url url: String): Response<Map<String, Any>>

    @POST
    suspend fun postGeneric(@retrofit2.http.Url url: String, @Body body: Map<String, Any?>): Response<Any>
}
