"use strict";


var isWebRTCSupported = false;
['RTCPeerConnection', 'webkitRTCPeerConnection', 'mozRTCPeerConnection', 'RTCIceGatherer'].forEach(function(item) {
    if (isWebRTCSupported) {
        return;
    }
    if (item in window) {
        isWebRTCSupported = true;
    }
});
function onTitleClick(id) {
    var targetId = "#";
    if (id == "connection-title") {
        targetId += "connection-detail";
    } else if (id == "browser-title") {
        targetId += "browser-detail";
    } else {
        console.error("wrong id : " + id);
        return;
    }
    if ($(targetId).is(":visible")) {
        $(targetId).hide();
    } else {
        $(targetId).show();
    }
}

function resetUI() {
    var connection =  $("#connection-title");
    var browser = $("#browser-title");
    connection.off("click").on("click", function () {
        onTitleClick(this.id);
    });
    browser.off("click").on("click", function () {
        onTitleClick(this.id);
    });
    connection[0].innerText = text.Connection;
    connection.css("background", "#E2E2E2");
    $("#browser-detail").hide();
    $("#connection-detail").hide();
    $("#connection-detail")[0].innerText = "";
    $("#browser-detail")[0].innerText = "";
}

function checkTBSVersion(ua) {
    //ua = "Mozilla/5.0 (Linux; Android 7.1.1; vivo X9 Build/NMF26F; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/53.0.2785.49 Mobile MQQBrowser/6.2 TBS/043501 Safari/537.36 MicroMessenger/6.5.13.1100 NetType/WIFI Language/zh_CN";
    var list = ua.split(" ");
    for (var i = 0; i < list.length; i++) {
        var item = list[i];
        if (item.indexOf("TBS") !== -1 || item.indexOf("tbs") !== -1) {
            var versionStr = item.split("/")[1];
            var version = parseInt(versionStr) || 0;
            if (version <= 43600) {
                alert("您的TBS版本号(" + versionStr + ")过低，不支持WebRTC，请升级!");
            }
        }
    }
}

function init() {

    resetUI();
    // $("#us")[0].innerText = navigator.userAgent;
    $("#stunserver").val("stun:webrtc.qq.com:8800");
    $("#start-btn").off("click").on("click", function () {
        resetUI();
        startBrowserTest();
        startConnectionTest()
    });
    checkTBSVersion(navigator.userAgent);
}

function startLoadingInner(text, dom, step) {
    for (var i = 0; i < step; i++) {
        text += ".";
    }
    dom.innerText = text;
}

function startLoading(text, dom) {
    intervalID = setInterval(function (text, dom) {
        startLoadingInner(text, dom, intervalStep);
        intervalStep++;
        if (intervalStep > 3) {
            intervalStep = 1;
        }
    }, 500, text, dom)
}

function stopLoading() {
    clearInterval(intervalID);
}

var connectionMessage = "";
var intervalID = 0;
var intervalStep = 1;
var text = {
    Connection : "连通性",
    ConnectionTest : "连通性测试",
    Browser : "浏览器"
};
init();

function onConnectionTestMessage(str) {
    connectionMessage += str + "\r\n";
}
function onConnectionTestDone(result) {
    stopLoading();
    $("#connection-detail")[0].innerText = connectionMessage;
    connectionMessage = "";
    var titleText = null;

    if (result == 0) {
        $("#connection-title").css("background", "#90dc90");
        titleText = text.ConnectionTest + " 成功 !!!";
    } else {
        $("#connection-title").css("background", "#dc9090");
        titleText = text.ConnectionTest + " 失败 !!!";
    }
    $("#connection-title")[0].innerText = titleText;
    disableButton(false, "start-btn");
}

function disableButton(isDisable, id) {
    var queryId = "#" + id;
    $(queryId).prop("disable", isDisable);
}

var FetchSigCgi = 'https://www.qcloudtrtc.com/sxb_dev/?svc=doll&cmd=fetchsig';
function getUserSig( callback ){
    
    $.ajax({
        type: "POST",
        url: FetchSigCgi,
        dataType: 'json',
        data:JSON.stringify({
            appid: 1400027849,
            id : "neallin"
        }),
        success: function (json) {
            if(json && json.errorCode === 0 ){
                //一会儿进入房间要用到
                var url = "wss://webrtc.qq.com:8687/?userSig="+json.data.userSig+"&sdkAppid=1400027849&identifier=neallin";
                callback(url );
            }else{
                console.error(json);
            }
        },
        error: function (err){
            console.error(err);
        }
    })
}

var websocket = null;
function getRelayIp(callback ,error){
    if (websocket) {
        try {
            websocket.close();
            websocket = null;
        } catch (e) {
            console.error(e);
        }
    }
    getUserSig( function(url){
        
        websocket = new WebSocket(url);

        websocket.onmessage = callback;
        websocket.onopen = wsonopen;
        websocket.onerror = error;
        websocket.onclose = wsonclose;
    })
}
// getRelayIp();
function wsonopen(data){
    console.debug(data);
}

function wsonclose(data){
    console.debug(data);
}

function wsonclose(data){
    console.debug(data);
}
function wsonclose(data){
    console.debug(data);
}

var canPlayType = function (element, type) {
    return element.canPlayType(type) == 'probably';
};

function checkH264DecodeSupport(){
    var element = document.createElement('video')
    return !!element.canPlayType && (canPlayType(element, 'video/mp4; codecs="avc1.42E01E"') || canPlayType(element, 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"'))
}

function checkH264Support( callback ){
    console.log('123', new RTCPeerConnection(null))
    var peer = new RTCPeerConnection(null);
    var decode = checkH264DecodeSupport()
    peer.createOffer({
        offerToReceiveAudio: 1,
        offerToReceiveVideo: 1
    }).then(function(data){
        console.debug('checkH264Support', data.sdp, data.sdp.toLowerCase().indexOf("h264") !== -1)
        var encode = data.sdp.toLowerCase().indexOf("h264") !== -1
        callback( encode , decode  )
        peer.close();
    },function(data){
        callback( false, decode )
    });
}

function startConnectionTest() {
    if(!isWebRTCSupported){
        onConnectionTestDone(-1);
        return;
    }
    getRelayIp(function(data){

        //IOS默认认为支持
        if(isMobile.iOS() && isMobile.safari()){
           onConnectionTestDone(0);
           return;
        }
        var json = JSON.parse(data.data);
        var ip = json.content.relayip;
        startLoading(text.ConnectionTest, $("#connection-title")[0]);
        var connectionTest = new WebRTCTest();
        connectionTest.setListener({
            onMessage : onConnectionTestMessage,
            done : onConnectionTestDone
        });
        var conTest = new ConnectionTest(connectionTest , 'stun:'+ip+":8800");
        console.log('conTest', conTest)
        conTest.run();
    },function(){
        onConnectionTestDone(-1);
    });

}

function testWebrtcUsage () {
    try {
       let testRTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection || window.RTCIceGatherer;
       if (testRTCPeerConnection) {
         let serverConfig = {
           "iceServers": [{
             urls: [
               "stun:stun.l.google.com:19302",
               "stun:stun1.l.google.com:19302",
               "stun:stun2.l.google.com:19302",
               "stun:stun.l.google.com:19302?transport=udp"
             ]
           }]
         };
         new RTCPeerConnection(serverConfig);
         return true;
       } else {
        //  throw "当前浏览器不支持该功能";
         return false
       }
     } catch (error) {
       console.error("当前浏览器不支持该功能")
       return false;
     }
 }


function checkTBSVersion(ua) {
    var list = ua.split(" ");
    for (var i = 0; i < list.length; i++) {
        var item = list[i];
        if (item.indexOf("TBS") !== -1 || item.indexOf("tbs") !== -1) {
            var versionStr = item.split("/")[1];
            var version = parseInt(versionStr) || 0;
            return version
        }
    }
    return null;
}

function startBrowserTest(){
    $("#browser-detail")[0].innerText = "";
    var titleText = null;
    $("#browser-title")[0].innerText = titleText;

    $("#browser-detail")[0].innerText = navigator.userAgent;
    var isMobileBrowser = false;
    for(var a in isMobile){
        if( isMobile[a]() ){
            isMobileBrowser = true
            titleText = a + ":";
            var version = checkTBSVersion(navigator.userAgent);
            if( a === 'Android' && version && version < 43600 ){
                $("#browser-title").css("background", "#dc9090");
                titleText =  "TBS (version:"+ version + ") 不支持 !!!";
            }
            else if(!isWebRTCSupported || (!isMobile.safari() && isMobile.iOS())) {
                $("#browser-title").css("background", "#dc9090");
                titleText = a + "当前浏览器不支持 !!!";
                // onVideoTestDone(-1);
                // onSupportTestDone(-1);
            }else{
                if( isMobile.safari() && isMobile.iOS()  ){
                    //ios 11 版本 11.0.3 以下不支持
                    var matches = (navigator.userAgent).match(/OS (\d+)_(\d+)_?(\d+)?/);
                    if(matches && matches[1]>=11 && (matches[2]>=1 || matches[3] >= 3) ){
                        $("#browser-title").css("background", "#90dc90");
                        titleText =  matches[0] + " 当前浏览器支持 !!!";
                    }else{
                        $("#browser-title").css("background", "#dc9090");
                        titleText =  matches[0] + "  不支持 !!!";
                    }
                }else{
                    $("#browser-title").css("background", "#90dc90");
                    titleText =  a + " 当前浏览器支持 !!!";
                }
            }
            $("#browser-title")[0].innerText = titleText;
            break;
        }
    }

    checkH264Support(function(encode, decode){
        titleText = "当前浏览器 不支持 !!!"
        if( !encode || !decode ){
            isWebRTCSupported = false
            if( !encode ){
                titleText +=" (不支持H264：编码)"
            }
            if( !decode ){
                titleText +=" (不支持H264：解码)"
            }
        }
        if( !isMobileBrowser){
            if(isWebRTCSupported){
                titleText =  "当前浏览器 支持 !!!";
                $("#browser-title").css("background", "#90dc90");
                $("#browser-title")[0].innerText = titleText;
            }else{
    
                
                $("#browser-title").css("background", "#dc9090");
                $("#browser-title")[0].innerText = titleText;
            }
        }
    });

    
}


