$('.fa-heart').click(function(){
    if($(this).attr('att') == 0){
        $(this).css('color', 'red');
        $(this).attr('att',1);
    } else {
        $(this).css('color', 'grey');
        $(this).attr('att',0);
    }
});