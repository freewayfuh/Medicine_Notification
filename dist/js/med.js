var cboxs = $('.form-check-input');
function change(){
    $('#nextbtn').prop('disabled', cboxs.filter(':checked').length > 0);
    
}


function next() {
    
    choices = check();
    if(choices){
        // display:none     classname="pillcheck" 
        $(".pillCheck")[0].style.display = 'none';

        // display & write  innerhtml of classname="pillDecision"
        $(".pillChosen")[0].style.display = 'initial';
        
        imgSrc = document.querySelectorAll('.med-imgs img');
        nameSrc = document.querySelectorAll('.medName');

        var string = '<div class="row row-cols-3">'
        choices.forEach(function(item) {
            string = string.concat('<div class="med-imgs col-sm-4 mt-3">');
            string = string.concat('<img src="'+imgSrc[item].src+'">');
            //                        .medName.shadow(id="medName_"+index)
            // | #{nameData[index]}
            string = string.concat('<div class="medName shadow" id="medName_5">'+nameSrc[item].innerHTML+'</div>');
            string = string.concat('</div>');
        })
        string = string.concat('</div>');
        $(".pillChosen")[0].innerHTML = string
        // display:         timeCheck
        $(".timeCheck")[0].style.display = 'initial';
        
        // button display
        $("#nextbtn").css('display','none');
        $("#backbtn").css('display','initial');
        $("#submitbtn").css('display','initial');

    }
    
}


function back() {
    // display:     classname="pillcheck" 
    $(".pillCheck")[0].style.display = 'initial';
    // display:none classname="pillChosen"
    $(".pillChosen")[0].style.display = 'none';
    // display:none .timeCheck
    $(".timeCheck")[0].style.display = 'none';

    // button display
    $("#nextbtn").css('display','initial');
    $("#backbtn").css('display','none');
    $("#submitbtn").css('display','none');
}

function check(){
    var check_val = [];
    $('input[type="checkbox"]').each(function(index) {
        if(this.checked)
            check_val.push(index)  
    });
    return check_val;
}

