function addToCart(proId){
    $.ajax({
      url:'/add-to-cart/'+proId,
      method:'get',
      success:(response)=>{
        if(response.status){
           let  count=$('#cart-count').html()
           count=parseInt(count)+1
           $("#cart-count").html(count)
        }
        
      }
    })

  }

  function addToWishlist(proId){
    $.ajax({
      url:'/add-to-wishlist/'+proId,
      method:'get',
      success:(response)=>{
        if(response.status){
           let  count=$('#wish-count').html()
           count=parseInt(count)+1
           $("#wish-count").html(count)
        }
        
      }
    })

  }