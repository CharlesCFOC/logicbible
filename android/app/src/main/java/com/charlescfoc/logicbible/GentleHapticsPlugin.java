package com.charlescfoc.logicbible;

import android.content.Context;
import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "GentleHaptics")
public class GentleHapticsPlugin extends Plugin {
    private static final int[] DURATIONS = {4, 6, 8, 10, 12};
    private static final int[] AMPLITUDES = {15, 25, 40, 55, 75};

    @PluginMethod
    public void tap(PluginCall call) {
        int index = Math.max(1, Math.min(5, call.getInt("level", 1))) - 1;
        Vibrator vibrator = (Vibrator) getContext().getSystemService(Context.VIBRATOR_SERVICE);
        if (vibrator != null && vibrator.hasVibrator()) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && vibrator.hasAmplitudeControl()) {
                vibrator.vibrate(VibrationEffect.createOneShot(DURATIONS[index], AMPLITUDES[index]));
            } else {
                vibrator.vibrate(DURATIONS[index]);
            }
        }
        call.resolve();
    }
}
