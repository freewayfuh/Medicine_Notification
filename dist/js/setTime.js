$(document).ready(function() {
    new Rolldate({
        el: '#hour',
        lang: { 
            title: '選擇時間', 
            cancel: 'Cancel', 
            confirm: 'Confirm',
            hour: '時' 
        },
        value: '23',
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
        value: '10',
        format: 'mm',
    })
})
