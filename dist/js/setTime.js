function clock() {
    new Rolldate({
        el: '#hour',
        lang: { 
            title: '選擇時間', 
            cancel: 'Cancel', 
            confirm: 'Confirm',
            hour: '時' 
        },
        value: '',
        format: 'hh'
    })
    new Rolldate({
        el: '#min',
        lang: { 
            title: '選擇時間', 
            cancel: 'Cancel', 
            confirm: 'Confirm', 
            min: '分' 
        },
        value: '',
        format: 'mm',
    })
}

function HourCheck(V){
    if(V.value.indexOf('.')!=-1) V.value=Math.round(V.value)
    if(V.value.length>2) V.value=V.value.slice(0,2)
    if(V.value.indexOf('-')!=-1 || V.value.indexOf('+')!=-1) V.value=0
    if(V.value>=23) V.value=23
    $(V.id).val(V.value)
}

function MinCheck(V){
    if(V.value.indexOf('.')!=-1) V.value=Math.round(V.value)
    if(V.value.length>2) V.value=V.value.slice(0,2)
    if(V.value.indexOf('-')!=-1 || V.value.indexOf('+')!=-1) V.value=0
    if(V.value>=59) V.value=59
    $(V.id).val(V.value)    
}