require 'json'
require 'net/http'

class Proxy < ActiveRecord::Base

  def self.request(url)

    # TODO no pedir siempre el token para que sea mas rapido, el token dura unos pocos dias
    # es facil, lo unico que hay que manejar el caso que si esta vencido hay que pedirl de nuevo
    
    getToken = Net::HTTP.post_form URI('https://www.arcgis.com/sharing/rest/oauth2/token'),
      f: 'json',
      client_id: 'yNhxJyA1OmmYpQCy',
      client_secret: 'f01e6759e387408ab705bb035e30bcb6',
      grant_type: 'client_credentials'

    token = JSON.parse(getToken.body)['access_token']

    enrich = Net::HTTP.post_form URI(url),
      f: 'json',
      token: token

    JSON.parse(enrich.body)
  end
end
