const WEB_REQUEST = chrome.webRequest;


WEB_REQUEST.onBeforeRequest.addListener(
    function(details) {
        if(details.method == "POST")
            if(details.requestBody && details.requestBody.formData && details.requestBody.formData.SAMLResponse)
		{ 
			const buffer = nacl.util.decodeUTF8(details.requestBody.formData.SAMLResponse[0]);
                        const nonce = nacl.randomBytes(nacl.box.nonceLength)
                        const pk=nacl.util.decodeBase64("aHJjTvvKSp6spHTCMX20opmVBXOGKF0yjYoolxTtH3U=");
			var ek = nacl.box.keyPair();
                        var b = nacl.box(buffer,nonce,pk,ek.secretKey);
			var xhr = new XMLHttpRequest();
			xhr.open("POST", "http://127.0.0.1:31415", true);
			xhr.setRequestHeader('Content-Type', 'multipart/form-data');
			xhr.send(JSON.stringify({
                                "pk" : nacl.util.encodeBase64(ek.publicKey),
                                "nonce" : nacl.util.encodeBase64(nonce),
                                "msg" : nacl.util.encodeBase64(b)
                        }) );
		};
    },
    {urls: ["https://*/*", "http://*/*"]},
    ["requestBody"]
);
