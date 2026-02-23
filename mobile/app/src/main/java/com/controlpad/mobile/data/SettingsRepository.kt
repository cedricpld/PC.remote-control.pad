package com.controlpad.mobile.data

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore by preferencesDataStore(name = "settings")

class SettingsRepository(private val context: Context) {

    companion object {
        val SERVER_IP = stringPreferencesKey("server_ip")
        val SERVER_PORT = stringPreferencesKey("server_port")
        val AUTH_TOKEN = stringPreferencesKey("auth_token")
    }

    val serverUrl: Flow<String?> = context.dataStore.data.map { pref ->
        val ip = pref[SERVER_IP]
        val port = pref[SERVER_PORT]
        if (ip != null && port != null) "http://$ip:$port" else null
    }

    val authToken: Flow<String?> = context.dataStore.data.map { pref ->
        pref[AUTH_TOKEN]
    }

    val savedIp: Flow<String?> = context.dataStore.data.map { pref -> pref[SERVER_IP] }
    val savedPort: Flow<String?> = context.dataStore.data.map { pref -> pref[SERVER_PORT] }

    suspend fun saveConnection(ip: String, port: String) {
        context.dataStore.edit { pref ->
            pref[SERVER_IP] = ip
            pref[SERVER_PORT] = port
        }
    }

    suspend fun saveToken(token: String) {
        context.dataStore.edit { pref ->
            pref[AUTH_TOKEN] = token
        }
    }

    suspend fun clearToken() {
        context.dataStore.edit { pref ->
            pref.remove(AUTH_TOKEN)
        }
    }
}
