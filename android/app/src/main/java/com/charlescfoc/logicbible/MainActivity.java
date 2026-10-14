package com.charlescfoc.logicbible;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(GentleHapticsPlugin.class);
        super.onCreate(savedInstanceState);

        WindowInsetsControllerCompat systemBars = WindowCompat.getInsetsController(
            getWindow(),
            getWindow().getDecorView()
        );
        systemBars.hide(WindowInsetsCompat.Type.statusBars());
        systemBars.setSystemBarsBehavior(
            WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        );
    }
}
