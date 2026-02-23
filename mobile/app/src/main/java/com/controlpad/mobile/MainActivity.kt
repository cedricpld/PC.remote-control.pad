package com.controlpad.mobile

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.controlpad.mobile.data.SettingsRepository
import com.controlpad.mobile.ui.screens.EditBlockScreen
import com.controlpad.mobile.ui.screens.HomeScreen
import com.controlpad.mobile.ui.screens.LoginScreen
import com.controlpad.mobile.ui.theme.ControlPadTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val settingsRepository = SettingsRepository(applicationContext)

        setContent {
            ControlPadTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    val navController = rememberNavController()

                    NavHost(navController = navController, startDestination = "login") {
                        composable("login") {
                            LoginScreen(navController, settingsRepository)
                        }
                        composable("home") {
                            HomeScreen(navController, settingsRepository)
                        }
                        composable(
                            "edit_block/{pageIndex}/{blockId}",
                            arguments = listOf(
                                navArgument("pageIndex") { type = NavType.IntType },
                                navArgument("blockId") { type = NavType.StringType }
                            )
                        ) { backStackEntry ->
                            EditBlockScreen(
                                navController,
                                settingsRepository,
                                backStackEntry.arguments?.getString("blockId"),
                                backStackEntry.arguments?.getInt("pageIndex") ?: 0
                            )
                        }
                    }
                }
            }
        }
    }
}
