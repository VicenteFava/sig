Rails.application.routes.draw do

  root 'static_pages#landing'
  
  get :proxy, to: 'requests#proxy_request'

end
