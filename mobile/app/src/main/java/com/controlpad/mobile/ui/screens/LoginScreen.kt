package com.controlpad.mobile.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.controlpad.mobile.data.SettingsRepository
import kotlinx.coroutines.launch
import com.controlpad.mobile.data.NetworkModule
import com.controlpad.mobile.data.LoginRequest
import kotlinx.coroutines.flow.first

@Composable
fun LoginScreen(
    navController: NavController,
    repository: SettingsRepository
) {
    val scope = rememberCoroutineScope()
    var ip by remember { mutableStateOf("192.168.1.x") }
    var port by remember { mutableStateOf("3000") }
    var password by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(false) }

    // Pre-fill from repository if available (effect)
    LaunchedEffect(Unit) {
        val savedToken = repository.authToken.first()
        val savedIpVal = repository.savedIp.first()
        val savedPortVal = repository.savedPort.first()
        
        if (!savedIpVal.isNullOrEmpty()) ip = savedIpVal
        if (!savedPortVal.isNullOrEmpty()) port = savedPortVal
        
        if (!savedToken.isNullOrEmpty() && !savedIpVal.isNullOrEmpty() && !savedPortVal.isNullOrEmpty()) {
            navController.navigate("home") {
                popUpTo("login") { inclusive = true }
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "Control Pad",
            fontSize = 32.sp,
            color = MaterialTheme.colorScheme.onBackground
        )
        Text(
            text = "Remote Client",
            fontSize = 16.sp,
            color = MaterialTheme.colorScheme.secondary
        )
        Spacer(modifier = Modifier.height(48.dp))

        OutlinedTextField(
            value = ip,
            onValueChange = { ip = it },
            label = { Text("Server IP") },
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(modifier = Modifier.height(16.dp))

        OutlinedTextField(
            value = port,
            onValueChange = { port = it },
            label = { Text("Port") },
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(modifier = Modifier.height(16.dp))

        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Password") },
            visualTransformation = PasswordVisualTransformation(),
            modifier = Modifier.fillMaxWidth()
        )

        if (error != null) {
            Text(text = error!!, color = Color.Red, modifier = Modifier.padding(top = 8.dp))
        }

        Spacer(modifier = Modifier.height(24.dp))

        Button(
            onClick = {
                loading = true
                error = null
                scope.launch {
                    try {
                        val baseUrl = "http://$ip:$port"
                        val api = NetworkModule.getApiService(baseUrl, repository)
                        val response = api.login(LoginRequest(password))

                        if (response.isSuccessful && response.body() != null) {
                            val token = response.body()!!.token
                            if (token != null) {
                                repository.saveConnection(ip, port)
                                repository.saveToken(token)
                                navController.navigate("home") {
                                    popUpTo("login") { inclusive = true }
                                }
                            } else {
                                error = "Login failed: No token received"
                            }
                        } else {
                            error = "Login failed: ${response.code()}"
                        }
                    } catch (e: Exception) {
                        error = "Connection error: ${e.localizedMessage}"
                    } finally {
                        loading = false
                    }
                }
            },
            modifier = Modifier.fillMaxWidth().height(50.dp),
            enabled = !loading
        ) {
            if (loading) CircularProgressIndicator(color = Color.White)
            else Text("Connect")
        }
    }
}
