package com.controlpad.mobile.data

import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.Response
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

class AuthInterceptor(private val repository: SettingsRepository) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val token = runBlocking { repository.authToken.first() }
        val request = chain.request().newBuilder().apply {
            if (!token.isNullOrEmpty()) {
                // The client server implementation (read in memory) doesn't use Bearer token middleware
                // explicitly on all routes, but for consistency we send it.
                // The Login endpoint returns { "token": "..." }
                // We'll attach it.
                addHeader("Authorization", "Bearer $token")
            }
        }.build()
        return chain.proceed(request)
    }
}

object NetworkModule {

    private var retrofit: Retrofit? = null
    private var currentBaseUrl: String? = null

    fun getApiService(baseUrl: String, repository: SettingsRepository? = null): ApiService {
        if (retrofit == null || currentBaseUrl != baseUrl) {
            val logging = HttpLoggingInterceptor()
            logging.level = HttpLoggingInterceptor.Level.BODY

            val builder = OkHttpClient.Builder()
                .addInterceptor(logging)
                .connectTimeout(5, TimeUnit.SECONDS)
                .readTimeout(5, TimeUnit.SECONDS)

            if (repository != null) {
                builder.addInterceptor(AuthInterceptor(repository))
            }

            val client = builder.build()

            val url = if (baseUrl.endsWith("/")) baseUrl else "$baseUrl/"

            retrofit = Retrofit.Builder()
                .baseUrl(url)
                .client(client)
                .addConverterFactory(GsonConverterFactory.create())
                .build()

            currentBaseUrl = baseUrl
        }
        return retrofit!!.create(ApiService::class.java)
    }
}
