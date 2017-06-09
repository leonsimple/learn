package cn.iotguard.phonecontroller;

import android.content.Context;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.util.DisplayMetrics;
import android.view.Display;
import android.view.WindowManager;
import android.widget.TextView;

import com.cj.ScreenShotUtil.ShellUtils;

public class MainActivity extends AppCompatActivity {

    private String mText;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        final TextView textView = (TextView) findViewById(R.id.text);
//        SharedPreferences sp = getPreferences(MODE_PRIVATE);
//
//        if (!sp.getBoolean("5555_OPEN", false)){
//            try{
//                List<String> cmds = new ArrayList<>();
//                cmds.add("setprop service.adb.tcp.port 5555\n");
//                cmds.add("stop adbd\n");
//                cmds.add("start adbd\n");
//                ShellUtils.execCommand(cmds,true);
//                sp.edit().putBoolean("5555_OPEN", true).apply();
//            }catch (Exception e){
//                e.printStackTrace();
//            }
//        }


        DisplayMetrics dm = new DisplayMetrics();
        Display mDisplay = ((WindowManager) getSystemService(Context.WINDOW_SERVICE)).getDefaultDisplay();
        mDisplay.getMetrics(dm);

        WifiManager wifiManager = (WifiManager)getApplicationContext().getSystemService(Context.WIFI_SERVICE);
//判断wifi是否开启

        WifiInfo wifiInfo = wifiManager.getConnectionInfo();
        int ipAddress = wifiInfo.getIpAddress();
        String ip = intToIp(ipAddress);
        mText = dm.widthPixels + "X" + dm.heightPixels + "\n\nip:" + ip;
        new Thread(new Runnable() {
            @Override
            public void run() {
                ShellUtils.CommandResult commandResult = ShellUtils.execCommand("export CLASSPATH=/data/app/cn.iotguard.phonecontroller-1/base.apk;exec app_process /system/bin cn.iotguard.phonecontroller.Main", true);
                mText = mText + "\n\n result:errorMsg" + commandResult.errorMsg + "result:successMsg" + commandResult.successMsg;
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        textView.setText(mText);
                    }
                });
            }
        }).start();
        textView.setText(mText);

    }

    public String intToIp(int i) {
        return (i & 0xFF) + "." +
                ((i >> 8 ) & 0xFF) + "." +
                ((i >> 16) & 0xFF) + "." +
                ((i >> 24) & 0xFF);
    }

}
