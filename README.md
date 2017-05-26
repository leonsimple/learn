usage:
```
要求root
1. app/src/main/res/raw直接在该路径使用Terminal
2. usb连接手机，执行以下adb 指令
```
adb install app-debug.apk
adb forward tcp:56789 tcp:56789
adb shell "export CLASSPATH=/data/app/cn.iotguard.phonecontroller-1/base.apk;exec app_process /system/bin cn.iotguard.phonecontroller.Main"
```

做的事情很简单，手机安装apk，然后进行了端口映射，最后启动服务程序。

3.打开手机开app查看手机IP
首次打开会开启手机5555端口，并重启手机adb进程，
 adb连接会中断，输入 adb connect IP 连接手机

 打开`viewer.html`
 更换文件中IP
     var screenFile = 'http://10.0.0.15:56789/screenshot.jpg?';
       var ws = new WebSocket('ws://10.0.0.15:56789/input');
 右键open in Browser即可在浏览。
```
4.vysor_release_dex2jar.jar是vysorApp源码