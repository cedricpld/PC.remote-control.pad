package com.controlpad.mobile.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import com.controlpad.mobile.data.AppConfig
import com.controlpad.mobile.data.NetworkModule
import com.controlpad.mobile.data.Page
import com.controlpad.mobile.data.SettingsRepository
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ManagePagesDialog(
    config: AppConfig,
    repository: SettingsRepository,
    onDismiss: () -> Unit,
    onConfigUpdated: (AppConfig) -> Unit
) {
    val scope = rememberCoroutineScope()
    var pages by remember { mutableStateOf(config.pages) }
    var newPageName by remember { mutableStateOf("") }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            shape = MaterialTheme.shapes.large
        ) {
            Column(
                modifier = Modifier
                    .padding(16.dp)
            ) {
                Text(
                    text = "Manage Pages",
                    style = MaterialTheme.typography.titleLarge
                )
                Spacer(modifier = Modifier.height(16.dp))

                // List existing pages
                pages.forEachIndexed { index, page ->
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
                    ) {
                        Text(text = page.name, style = MaterialTheme.typography.bodyLarge)
                        IconButton(
                            onClick = {
                                if (pages.size > 1) {
                                    val newPages = pages.toMutableList()
                                    newPages.removeAt(index)
                                    pages = newPages
                                }
                            }
                        ) {
                            Icon(Icons.Default.Delete, contentDescription = "Delete Page")
                        }
                    }
                    Divider()
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Add new page
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
                ) {
                    OutlinedTextField(
                        value = newPageName,
                        onValueChange = { newPageName = it },
                        label = { Text("New Page Name") },
                        modifier = Modifier.weight(1f)
                    )
                    IconButton(
                        onClick = {
                            if (newPageName.isNotEmpty()) {
                                val newPage = Page(
                                    id = java.util.UUID.randomUUID().toString(),
                                    name = newPageName,
                                    blocks = emptyList()
                                )
                                pages = pages + newPage
                                newPageName = ""
                            }
                        }
                    ) {
                        Icon(Icons.Default.Add, contentDescription = "Add Page")
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    TextButton(onClick = onDismiss) {
                        Text("Cancel")
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                        onClick = {
                            scope.launch {
                                val newConfig = config.copy(pages = pages)
                                val url = repository.serverUrl.first()
                                if (url != null) {
                                    try {
                                        val api = NetworkModule.getApiService(url, repository)
                                        api.saveConfig(newConfig)
                                        onConfigUpdated(newConfig)
                                        onDismiss()
                                    } catch (e: Exception) {
                                        // Handle error
                                    }
                                }
                            }
                        }
                    ) {
                        Text("Save Changes")
                    }
                }
            }
        }
    }
}
