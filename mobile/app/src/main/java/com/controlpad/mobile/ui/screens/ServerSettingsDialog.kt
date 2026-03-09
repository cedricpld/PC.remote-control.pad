package com.controlpad.mobile.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import com.controlpad.mobile.data.AppConfig
import com.controlpad.mobile.data.NetworkModule
import com.controlpad.mobile.data.PcServerConfig
import com.controlpad.mobile.data.SettingsRepository
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ServerSettingsDialog(
    repository: SettingsRepository,
    onDismiss: () -> Unit,
    onLogout: () -> Unit
) {
    val scope = rememberCoroutineScope()
    var currentPassword by remember { mutableStateOf("") }
    var newPassword by remember { mutableStateOf("") }
    var statusMessage by remember { mutableStateOf("") }

    var config by remember { mutableStateOf<AppConfig?>(null) }
    var pcServerIp by remember { mutableStateOf("") }
    var pcServerPort by remember { mutableStateOf("") }

    // Load existing config to get PC server settings
    LaunchedEffect(Unit) {
        val url = repository.serverUrl.first() ?: return@LaunchedEffect
        val api = NetworkModule.getApiService(url, repository)
        val res = api.getConfig()
        if (res.isSuccessful) {
            config = res.body()
            pcServerIp = config?.pcServer?.ip ?: ""
            pcServerPort = config?.pcServer?.port?.toString() ?: "8765"
        }
    }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            shape = MaterialTheme.shapes.extraLarge,
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(
                modifier = Modifier
                    .padding(24.dp)
                    .verticalScroll(rememberScrollState()),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text("Settings", style = MaterialTheme.typography.titleLarge)
                Spacer(modifier = Modifier.height(24.dp))

                // PC Server Connection Settings
                Text("PC Server Connection", style = MaterialTheme.typography.titleMedium, modifier = Modifier.align(Alignment.Start))
                OutlinedTextField(
                    value = pcServerIp,
                    onValueChange = { pcServerIp = it },
                    label = { Text("Windows PC Server IP") },
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = pcServerPort,
                    onValueChange = { pcServerPort = it },
                    label = { Text("PC Server Port (ex: 8765)") },
                    modifier = Modifier.fillMaxWidth()
                )
                Button(
                    onClick = {
                        scope.launch {
                            val url = repository.serverUrl.first() ?: return@launch
                            if (config != null) {
                                val newConfig = config!!.copy(
                                    pcServer = PcServerConfig(pcServerIp, pcServerPort.toIntOrNull() ?: 8765)
                                )
                                try {
                                    val api = NetworkModule.getApiService(url, repository)
                                    val res = api.saveConfig(newConfig)
                                    if(res.isSuccessful) statusMessage = "PC Config Saved"
                                    else statusMessage = "Failed to save config"
                                    config = newConfig
                                } catch (e: Exception) {
                                    statusMessage = "Error: ${e.message}"
                                }
                            }
                        }
                    },
                    modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp)
                ) {
                    Text("Save PC Server Config")
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Authentication
                Text("Change Password", style = MaterialTheme.typography.titleMedium, modifier = Modifier.align(Alignment.Start))
                OutlinedTextField(
                    value = currentPassword,
                    onValueChange = { currentPassword = it },
                    label = { Text("Current Password") },
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = newPassword,
                    onValueChange = { newPassword = it },
                    label = { Text("New Password") },
                    modifier = Modifier.fillMaxWidth()
                )
                Button(
                    onClick = {
                        scope.launch {
                            val url = repository.serverUrl.first() ?: return@launch
                            val api = NetworkModule.getApiService(url, repository)
                            try {
                                val res = api.postGeneric(url + "/api/update-password", mapOf("currentPassword" to currentPassword, "newPassword" to newPassword))
                                if (res.isSuccessful) statusMessage = "Password Updated"
                                else statusMessage = "Update Failed"
                            } catch (e: Exception) {
                                statusMessage = "Error: ${e.message}"
                            }
                        }
                    },
                    modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp)
                ) {
                    Text("Update Password")
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Power Controls
                Text("Power Controls", style = MaterialTheme.typography.titleMedium, modifier = Modifier.align(Alignment.Start))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(
                        onClick = {
                            scope.launch {
                                val url = repository.serverUrl.first() ?: return@launch
                                val payload = HashMap<String, Any>()
                                try {
                                    NetworkModule.getApiService(url, repository).postGeneric(url + "/api/restart-server", payload)
                                    statusMessage = "Restarting Web Server..."
                                } catch(e: Exception) { statusMessage = "Request sent." }
                            }
                        },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary)
                    ) {
                        Text("Restart Web")
                    }
                    Button(
                        onClick = {
                            scope.launch {
                                val url = repository.serverUrl.first() ?: return@launch
                                val payload = HashMap<String, Any>()
                                try {
                                    NetworkModule.getApiService(url, repository).postGeneric(url + "/api/stop-server", payload)
                                    statusMessage = "Stopping Web Server..."
                                } catch(e: Exception) { statusMessage = "Request sent." }
                            }
                        },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                    ) {
                        Text("Stop Web")
                    }
                }

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(
                        onClick = {
                            scope.launch {
                                val url = repository.serverUrl.first() ?: return@launch
                                val payload = HashMap<String, Any>()
                                try {
                                    NetworkModule.getApiService(url, repository).postGeneric(url + "/api/restart-pc-server", payload)
                                    statusMessage = "Restarting PC Server..."
                                } catch(e: Exception) { statusMessage = "Request sent." }
                            }
                        },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary)
                    ) {
                        Text("Restart PC")
                    }
                    Button(
                        onClick = {
                            scope.launch {
                                val url = repository.serverUrl.first() ?: return@launch
                                val payload = HashMap<String, Any>()
                                try {
                                    NetworkModule.getApiService(url, repository).postGeneric(url + "/api/stop-pc-server", payload)
                                    statusMessage = "Stopping PC Server..."
                                } catch(e: Exception) { statusMessage = "Request sent." }
                            }
                        },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                    ) {
                        Text("Stop PC")
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))
                if (statusMessage.isNotEmpty()) {
                    Text(statusMessage, color = MaterialTheme.colorScheme.primary)
                    Spacer(modifier = Modifier.height(16.dp))
                }

                OutlinedButton(
                    onClick = {
                        scope.launch { repository.clearToken() }
                        onLogout()
                    },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Change Web IP / Logout")
                }

                TextButton(onClick = onDismiss, modifier = Modifier.padding(top = 8.dp)) {
                    Text("Close")
                }
            }
        }
    }
}
