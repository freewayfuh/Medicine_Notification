function switchToContactorPillBox(){
    Nav_contactor_animate()
    $('#myPillbox').css('display','none')
    $('#superviseePillbox').css('display', 'none')
    $('#footer').css('display', 'none')
    $('#superviseePillboxs_list').css('display', 'initial')
    $('#pillDetail').empty()
    $('#supervisee').empty()
 
}

function switchToMinePillBox(){
    Nav_mine_animate()
    $('#myPillbox').css('display', 'initial')
    $('#superviseePillbox').css('display', 'none')
    $('#footer').css('display', 'initial')
    $('#superviseePillboxs_list').css('display', 'none') 
    $('#pillDetail').empty()
    $('#supervisee').empty()
}

function switchToContactorNotify(){
    Nav_contactor_animate()            
    $('#myMedNotify').css('display','none')
    $('#superviseeMedNotify').css('display', 'none')
    $('#footer').css('display', 'none')
    $('#superviseeMedNotifys_list').css('display', 'initial')
    $('#pickMedPage').empty()
    $('#supervisee').empty()       
}

function switchToMineNotify(){
    Nav_mine_animate()            
    $('#myMedNotify').css('display', 'initial')
    $('#superviseeMedNotify').css('display', 'none')
    $('#footer').css('display', 'initial')
    $('#superviseeMedNotifys_list').css('display', 'none') 
    $('#pickMedPage').empty()
    $('#supervisee').empty()    
}

