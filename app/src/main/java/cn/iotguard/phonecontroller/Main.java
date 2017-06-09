package cn.iotguard.phonecontroller;

import android.graphics.Bitmap;
import android.graphics.Matrix;
import android.hardware.input.InputManager;
import android.os.Build;
import android.os.Looper;
import android.os.SystemClock;
import android.support.v4.view.InputDeviceCompat;
import android.view.InputEvent;
import android.view.KeyEvent;
import android.view.MotionEvent;

import com.koushikdutta.async.http.WebSocket;
import com.koushikdutta.async.http.server.AsyncHttpServer;
import com.koushikdutta.async.http.server.AsyncHttpServerRequest;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.SocketException;
import java.util.Enumeration;
import java.util.Timer;
import java.util.TimerTask;

/**
 * Created by caowentao on 2016/11/23.
 */

public class Main {

    private static final int LISTEN_PORT = 56789;
    private static final String KEY_FINGER_DOWN = "fingerdown";
    private static final String KEY_FINGER_UP = "fingerup";
    private static final String KEY_FINGER_MOVE = "fingermove";
    private static final String KEY_CHANGE_SIZE = "change_size";
    private static final String KEY_BEATHEART = "beatheart";
    private static final String KEY_EVENT_TYPE = "type";
    private static final String KEY_BACK= "back";
    private static final String KEY_HOME = "home";
    private static final String KEY_QUALITY = "quality";
    private static final String KEY_MENU = "menu";
    private static InputManager sInputManager;
    private static Method sInjectInputEventMethod;
    private static final float BASE_WIDTH = 720;
    private static final float BASE_HEIGHT = 1280;
    private static int sPictureWidth = 360;
    private static int sPictureHeight = 640;
    private static int sRotate = 0;
    private static Thread sSendImageThread;
    private static Timer sTimer;
    private static boolean sViewerIsAlive;
    private static boolean sThreadKeepRunning;
    private static Method sScreenshot;
    private static int quality = 20;
    private static Matrix sMatrix;

    public static void main(String[] args) {
        Looper.prepare();
        System.out.println("PhoneController start...");
        sMatrix = new Matrix();
        sTimer = new Timer();

            try {
                getGPRSLocalIpAddress();

                sInputManager = (InputManager) InputManager.class.getDeclaredMethod("getInstance").invoke(null);
                sInjectInputEventMethod = InputManager.class.getMethod("injectInputEvent", InputEvent.class, Integer.TYPE);
                AsyncHttpServer httpServer = new AsyncHttpServer();
                httpServer.websocket("/input", new InputHandler());
                httpServer.listen(LISTEN_PORT);
                Looper.loop();
            } catch (Exception e) {
                System.out.println("error: " + e.getMessage());
            }

    }

    public static String getGPRSLocalIpAddress() {
        try {
            for (Enumeration<NetworkInterface> en = NetworkInterface
                    .getNetworkInterfaces(); en.hasMoreElements();) {
                NetworkInterface intf = en.nextElement();
                for (Enumeration<InetAddress> enumIpAddr = intf
                        .getInetAddresses(); enumIpAddr.hasMoreElements();) {
                    InetAddress inetAddress = enumIpAddr.nextElement();
                    if (!inetAddress.isLoopbackAddress()) {
                        System.out.println("ip:  " + inetAddress.getHostAddress() );
                    }
                }
            }
        } catch (SocketException ex) {
            System.out.println("error" + ex.getMessage());
        }
        return null;
    }

    private static class InputHandler implements AsyncHttpServer.WebSocketRequestCallback {
        @Override
        public void onConnected(WebSocket webSocket, AsyncHttpServerRequest request) {
            System.out.println("websocket connected.");
            if (sSendImageThread == null) {
                sThreadKeepRunning = true;
                sSendImageThread = new Thread(new SendScreenShotThread((webSocket)));
                sSendImageThread.start();
                sTimer.schedule(new SendScreenShotThreadWatchDog(), 5000, 5000);
                webSocket.setStringCallback(new WebSocket.StringCallback() {
                    @Override
                    public void onStringAvailable(String s) {
                        try {
                            System.out.println(s);
                            JSONObject event = new JSONObject(s);
                            String eventType = event.getString(KEY_EVENT_TYPE);
                            switch (eventType) {
                                case KEY_FINGER_DOWN:
                                    float x = event.getInt("x") * (BASE_WIDTH / sPictureWidth);
                                    float y = event.getInt("y") * (BASE_WIDTH / sPictureWidth);
                                    injectMotionEvent(InputDeviceCompat.SOURCE_TOUCHSCREEN, 0,
                                            SystemClock.uptimeMillis(), x, y, 1.0f);
                                    break;
                                case KEY_FINGER_UP:
                                    x = event.getInt("x") * (BASE_WIDTH / sPictureWidth);
                                    y = event.getInt("y") * (BASE_WIDTH / sPictureWidth);
                                    injectMotionEvent(InputDeviceCompat.SOURCE_TOUCHSCREEN, 1,
                                            SystemClock.uptimeMillis(), x, y, 1.0f);
                                    break;
                                case KEY_FINGER_MOVE:
                                    x = event.getInt("x") * (BASE_WIDTH / sPictureWidth);
                                    y = event.getInt("y") * (BASE_WIDTH / sPictureWidth);
                                    injectMotionEvent(InputDeviceCompat.SOURCE_TOUCHSCREEN, 2,
                                            SystemClock.uptimeMillis(), x, y, 1.0f);
                                    break;
                                case KEY_BEATHEART:
                                    sViewerIsAlive = true;
                                    break;
                                case KEY_CHANGE_SIZE:
//                                    sPictureWidth = event.getInt("w");
//                                    sPictureHeight = event.getInt("h");
                                    sRotate = event.getInt("r");
                                    break;
                                case KEY_BACK:
                                    sendKeyEvent(sInputManager, sInjectInputEventMethod, 257, 4, false);
                                    break;
                                case KEY_HOME:
                                    sendKeyEvent(sInputManager, sInjectInputEventMethod, 257, 3, false);
                                    break;
                                case KEY_QUALITY:
                                    int q = event.getInt("q");
                                    System.out.println("q:"+ q);
                                    quality = q;
                                    break;
                                case KEY_MENU:
                                    sendKeyEvent(sInputManager, sInjectInputEventMethod, 257, 187, false);
                                    break;
                            }
                        } catch (Exception e) {
                            System.out.println(e.getMessage());
                        }
                    }
                });
            } else {
                webSocket.close();
            }
        }
    }

    private static class SendScreenShotThreadWatchDog extends TimerTask {
        @Override
        public void run() {
            if (sViewerIsAlive) {
                sViewerIsAlive = false;
            } else if (sSendImageThread != null) {
                System.out.println("exit thread");
                sThreadKeepRunning = false;
                sSendImageThread = null;
                cancel();
                sTimer.purge();
            }
        }
    }

    private static class SendScreenShotThread implements Runnable {

        WebSocket mWebSocket;
        String mSurfaceName;
        SendScreenShotThread(WebSocket webSocket) {
            mWebSocket = webSocket;
            if (Build.VERSION.SDK_INT <= 17) {
                mSurfaceName = "android.view.Surface";
            } else {
                mSurfaceName = "android.view.SurfaceControl";
            }
        }
        @Override
        public void run() {
            while (sThreadKeepRunning) {
                try {
                    if (sScreenshot == null) {
                        sScreenshot = Class.forName(mSurfaceName)
                            .getDeclaredMethod("screenshot", new Class[]{Integer.TYPE, Integer.TYPE});
                    }
                    Thread.sleep(50);
                    Bitmap bitmap = (Bitmap) sScreenshot
                            .invoke(null, sPictureWidth, sPictureHeight);
                    sMatrix.setRotate(sRotate);
                    if (bitmap != null) {
                        Bitmap resultBitmap = Bitmap.createBitmap(bitmap, 0, 0, sPictureWidth, sPictureHeight, sMatrix, false);
                        ByteArrayOutputStream bout = new ByteArrayOutputStream();
                        resultBitmap.compress(Bitmap.CompressFormat.JPEG, quality, bout);
                        bout.flush();
                        mWebSocket.send(bout.toByteArray());
                    } else {
                        System.out.println("bitmap is null");
                    }
                } catch (Exception e) {
                    System.out.println(e.getMessage());
                    break;
                }
            }
            mWebSocket.close();
        }
    }

    private static void injectMotionEvent(int inputSource, int action, long when, float x, float y, float pressure) {
        try {
            MotionEvent event = MotionEvent.obtain(when, when, action, x, y, pressure, 1.0f, 0, 1.0f, 1.0f, 0, 0);
            event.setSource(inputSource);
            sInjectInputEventMethod.invoke(sInputManager, event, 0);
            event.recycle();
        } catch (Exception e) {
            System.out.println(e.getMessage());
        }
    }

    private static void sendKeyEvent(InputManager paramInputManager, Method paramMethod, int paramInt1, int paramInt2, boolean paramBoolean)
            throws InvocationTargetException, IllegalAccessException
    {
        long l = SystemClock.uptimeMillis();
        if (paramBoolean);
        for (int i = 1; ; i = 0)
        {
            injectKeyEvent(paramInputManager, paramMethod, new KeyEvent(l, l, 0, paramInt2, 0, i, -1, 0, 0, paramInt1));
            injectKeyEvent(paramInputManager, paramMethod, new KeyEvent(l, l, 1, paramInt2, 0, i, -1, 0, 0, paramInt1));
            return;
        }
    }

    private static void injectKeyEvent(InputManager paramInputManager, Method paramMethod, KeyEvent paramKeyEvent)
            throws InvocationTargetException, IllegalAccessException
    {
        Object[] arrayOfObject = new Object[2];
        arrayOfObject[0] = paramKeyEvent;
        arrayOfObject[1] = Integer.valueOf(0);
        paramMethod.invoke(paramInputManager, arrayOfObject);
    }
}