class RequestsController < ApplicationController

  def proxy_request
    render json: Proxy.request(request.query_string)
  end
end
