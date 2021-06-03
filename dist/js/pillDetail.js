function photoCompress (imgBase64,imgAttr){
	var img = new Image();
	img.src = imgBase64;
	img.onload = function(){
	  var that = this;
	  var w = that.width,h = that.height,scale = w / h;
	  w = imgAttr.width || w;
	  h = imgAttr.height || (w/scale);
	  var quality = 0.7;
	  var canvas = document.createElement('canvas');
	  var context = canvas.getContext('2d');
	  var anw = document.createAttribute("width");
	  anw.nodeValue = w;
	  canvas.setAttributeNode(anw);
	  var anh = document.createAttribute("height");
	  anh.nodeValue = h;
	  canvas.setAttributeNode(anh);
	  context.drawImage(img,0,0,w,h);
	  if(imgAttr.quality && imgAttr.quality <= 1 && imgAttr.quality > 0){
		quality = imgAttr.quality;
	  }
	  var imgType = 'image/jpeg';
	  var compress64 = canvas.toDataURL(imgType,quality);
	  $("#picURL").attr('url', compress64);
	};
  }
function readURL(input){
	if(input.files && input.files[0]){
		$(".pic1 div:nth-child(1)").remove();
		$(".pic1 div:nth-child(1)").remove();
		$(".pic1 div:nth-child(1)").remove();
		$(".pic1").toggleClass('pic2', true);
		$(".pic2").toggleClass('pic1', false);
			
		var reader = new FileReader();
		var fileObj=input.files[0];
        let imgBase64;
		reader.readAsDataURL(fileObj);
		reader.onload = function (e) {
			imgBase64 = e.target.result;
			$(".pic2").prepend("<div id=\"showpic\" style=\"background-image:url("+imgBase64+")\"\></div>");
			if(fileObj.size/1024>=1024){
				console.log('compress');
				var imgAttr = {quality : 0.1};
				photoCompress(imgBase64,imgAttr);
			  }
			  else
			    $("#picURL").attr('url', imgBase64);
		}
	}
}


function inputnumber(V){
	if(V.value>=1000) V.value=V.value.slice(0,3)
	if(V.value.slice(0,1)==0){
		if(V.value.indexOf('.')!=-1) V.value=V.value
		else V.value=V.value*10/10
	}
	if(V.value%0.5!=0) V.value=Math.round(V.value)
	$(V.id).val(V.value);
}

function showWarningMsg(){
	if(!$('#med_name').val()) $('.red_name').css('display','block')
	else $('.red_name').css('display','none')

	if(!$('#picURL').attr('url')) $('.red_pic').css('display','block')
	else $('.red_pic').css('display','none')
	
	if(!$('#total').val()) $('.red_total').css('display','block')
	else $('.red_total').css('display','none')
	
	if(!$('#each').val()) $('.red_each').css('display','block')
	else $('.red_each').css('display','none')
	
}
