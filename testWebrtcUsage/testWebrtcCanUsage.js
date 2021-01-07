import store from '../store/index'

var isMobile = {
	Android: function() {
		return /Android/i.test(navigator.userAgent);
	},
	iOS: function() {
		return /iPhone|iPad|iPod/i.test(navigator.userAgent);
	},
	safari: function() {
		return navigator.userAgent.toLowerCase().indexOf('safari/') > -1 &&  navigator.userAgent.toLowerCase().indexOf('chrome/') === -1;
	},
	PC: function() {
	}
};

function ConnectionTest(test , stun) {
	this.test = test;
	stun = stun || $("#stunserver").val();
	if (!stun) {
		stun = "stun:webrtc.qq.com:8800";
	}
	this.stun = {
		iceServers: [{
			urls: stun
		}],
		bundlePolicy: "max-bundle",
		rtcpMuxPolicy: "require",
		tcpCandidatePolicy: "disable",
		IceTransportsType: "nohost",
		sdpSemantics: 'plan-b'
	};

	this.optional = {
		optional: [{
			DtlsSrtpKeyAgreement: true
		}]
	};

}

ConnectionTest.prototype = {
	run : function () {
		this.createPeerConnection();
	},
	createPeerConnection : function () {
		console.debug('createPeerConnection',this.stun, this.optional)
		var peerConnection = new RTCPeerConnection(this.stun, this.optional);
		peerConnection.onicecandidate = onicecandidate_;
		var offerSdpOption = {
			offerToReceiveAudio: true,
			offerToReceiveVideo: true,
			voiceActivityDetection : false
		};
		peerConnection.createOffer(offerSdpOption).then(function (offer) {
			console.debug('createOffer',offer)
			peerConnection.setLocalDescription(offer);
		});
		var that = this;
		function onicecandidate_(e) {
			var candidate = e.candidate;
			if (filterIceCandidate_(candidate)) {
				that.test.reportSuccess(candidate.candidate);
				that.test.done();
				peerConnection.close();
			} else {
				that.test.reportInfo(candidate.candidate);
			}
		}
		function getIceCandidateType_(candidate) {
			try {
				var str = candidate.candidate;
				var params = str.split(" ");
				return params[7];
			} catch (e) {
				console.error("Get Ice Candidate Type Error : e = " + e);
				return null;
			}
		}

		function filterIceCandidate_(candidate) {
			if (candidate) {
				var str = candidate.candidate;
				if (str.indexOf("tcp") != -1) {
						return false;
				}
				return true;
			} else {
				window.webrtcConnectionRefuse = true
				store.commit('setWebrtcConnectionRefuse', true)
				console.log('vuex store', store.commit('setWebrtcConnectionRefuse', true))
				console.log('webrtc连不�?, window.webrtcConnectionRefuse)
			}
		}
	}
};

function WebRTCTest() {
	this.listener = {
		onMessage :null,
		done : null
	};
	this.errorCount = 0;
	this.warnCount = 0;
	this.successCount = 0;
}
WebRTCTest.prototype = {
	reportWarning : function (str) {
		console.error("warning : " + str);
		this.warnCount ++;
		if (this.listener.onMessage) {
			this.listener.onMessage(str);
		}
	},
	reportError : function (str) {
		console.error("error : " + str);
		this.errorCount ++;
		if (this.listener.onMessage) {
			this.listener.onMessage(str);
		}
	},
	reportInfo : function (str) {
		console.error("info : " + str);
		if (this.listener.onMessage) {
			this.listener.onMessage(str);
		}
	},
	reportFatal : function (str) {
		console.error("fatal : " + str);
		this.reportError(str);
		this.done();
	},
	reportSuccess : function (str) {
		console.error("success : " + str);
		this.successCount ++;
		if (this.listener.onMessage) {
			this.listener.onMessage(str);
		}
	},
	done : function () {
		var result = 0;
		if (this.errorCount + this.warnCount > 0 || this.successCount <= 0) {
			console.error("this webrtc test failed!!!");
			result = -1;
		}
		if (this.listener.done) {
			this.listener.done(result);
		}
	},
	setListener : function (listener) {
		this.listener.onMessage = listener.onMessage;
		this.listener.done = listener.done;
	}
};

 var isWebRTCSupported = false;
 ['RTCPeerConnection', 'webkitRTCPeerConnection', 'mozRTCPeerConnection', 'RTCIceGatherer'].forEach(function(item) {
		if (isWebRTCSupported) {
			return;
		}
		if (item in window) {
			isWebRTCSupported = true;
		}
 });
 
 
 function initTestWebrtcConnection() {
     // $("#us")[0].innerText = navigator.userAgent;
     // stun:webrtc.qq.com:8800
		if (testWebrtcUsage()) {
			startBrowserTest();
			startConnectionTest()
			checkTBSVersion(navigator.userAgent);
			console.log('初始�?--测试webrtc连接能力')
		} else {
			window.webrtcConnectionRefuse = true
			store.commit('setWebrtcConnectionRefuse', true)
			console.log('webrtc不能正常使用')
		}
 }
 
 var connectionMessage = "";
 var browserCanUseWebrtc = ""
 var text = {
		Connection : "连通�?,
		ConnectionTest : "连通性测�?,
		Browser : "浏览�?
 };
 
 function onConnectionTestMessage(str) {
		connectionMessage += str + "\r\n";
 }
 function onConnectionTestDone(result) {
     connectionMessage = "";
     var titleText = null;
 
     if (result == 0) {
         titleText = text.ConnectionTest + " 成功 !!!";
     } else {
         titleText = text.ConnectionTest + " 失败 !!!";
     }
     connectionMessage = titleText;
     console.log('connectionMessage', connectionMessage)
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
                 //一会儿进入房间要用�?
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
 
 var canPlayType = function (element, type) {
     return element.canPlayType(type) == 'probably';
 };
 
 function checkH264DecodeSupport(){
     var element = document.createElement('video')
     return !!element.canPlayType && (canPlayType(element, 'video/mp4; codecs="avc1.42E01E"') || canPlayType(element, 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"'))
 }
 
 function checkH264Support( callback ){
     var peer = new RTCPeerConnection(null);
     var decode = checkH264DecodeSupport()
     peer.createOffer({
         offerToReceiveAudio: 1,
         offerToReceiveVideo: 1
     }).then(function(data){
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
         //  throw "当前浏览器不支持该功�?;
          return false
        }
      } catch (error) {
        console.error("当前浏览器不支持该功�?)
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
     var titleText = null;
     var isMobileBrowser = false;
     for(var a in isMobile){
         if( isMobile[a]() ){
             isMobileBrowser = true
             titleText = a + ":";
             var version = checkTBSVersion(navigator.userAgent);
             if( a === 'Android' && version && version < 43600 ){
                 titleText =  "TBS (version:"+ version + ") 不支�?!!!";
             }
             else if(!isWebRTCSupported || (!isMobile.safari() && isMobile.iOS())) {
                 titleText = a + "当前浏览器不支持 !!!";
             }else{
                 if( isMobile.safari() && isMobile.iOS()  ){
                     //ios 11 版本 11.0.3 以下不支�?
                     var matches = (navigator.userAgent).match(/OS (\d+)_(\d+)_?(\d+)?/);
                     if(matches && matches[1]>=11 && (matches[2]>=1 || matches[3] >= 3) ){
                         titleText =  matches[0] + " 当前浏览器支�?!!!";
                     }else{
                         titleText =  matches[0] + "  不支�?!!!";
                     }
                 }else{
                     titleText =  a + " 当前浏览器支�?!!!";
                 }
             }
             browserCanUseWebrtc = titleText;
             console.log('browserCanUseWebrtc', titleText)
             break;
         }
     }
 
     checkH264Support(function(encode, decode){
         titleText = "当前浏览�?不支�?!!!"
         if( !encode || !decode ){
             isWebRTCSupported = false
             if( !encode ){
                 titleText +=" (不支持H264：编�?"
             }
             if( !decode ){
                 titleText +=" (不支持H264：解�?"
             }
         }
         if( !isMobileBrowser){
             if(isWebRTCSupported){
                 titleText =  "当前浏览�?支持 !!!";
                 browserCanUseWebrtc = titleText;
             }else{
                 browserCanUseWebrtc = titleText;
             }
         }
     }); 
 }
 
window.initTestWebrtcConnection = initTestWebrtcConnection