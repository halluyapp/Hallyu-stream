package com.hallyustream

import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  /**
   * The name registered from JavaScript (app.json → index.js).
   * One component, two form factors: the JS side decides whether to mount the
   * phone tab navigator or the ten-foot television navigator.
   */
  override fun getMainComponentName(): String = "HallyuStream"

  /**
   * react-native-screens requires the saved instance state to be dropped so
   * Android does not try to restore fragments we manage from JS.
   */
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(null)
  }

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
