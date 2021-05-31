$("#pic").change(function(){
	readURL(this);
})

function readURL(input){
	if(input.files && input.files[0]){
		$(".pic1 div:nth-child(1)").remove();
		$(".pic1 div:nth-child(1)").remove();
		$(".pic1 div:nth-child(1)").remove();
		$(".pic1").toggleClass('pic2', true);
		$(".pic2").toggleClass('pic1', false);
			
		var reader = new FileReader();
		
		reader.onload = function (e) {
			$(".pic2").prepend("<div id=\"showpic\" style=\"background-image:url("+e.target.result+")\"\></div>");
			$("#picURL").val(e.target.result);
		}
		reader.readAsDataURL(input.files[0]);
	}
}

$("#upload-wrap button").click(function(){
		$(".pic2").toggleClass('pic1', true);
		$(".pic1").toggleClass('pic2', false);
		$(".pic1 #showpic").remove();
		$(".pic1").prepend("<div>(每種藥物僅可上傳一種照片)</div>");
		$(".pic1").prepend("<div>上傳照片</div>");
		$(".pic1").prepend("<div><img src=\"img/graph.png\"></div>");
		$("#picURL").val("");
})

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
	
	if(!$('#picURL').val()) $('.red_pic').css('display','block')
	else $('.red_pic').css('display','none')
	
	if(!$('#total').val()) $('.red_total').css('display','block')
	else $('.red_total').css('display','none')
	
	if(!$('#each').val()) $('.red_each').css('display','block')
	else $('.red_each').css('display','none')
	
}
