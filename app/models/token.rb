require 'json'
require 'net/http'

class Token < ActiveRecord::Base
  
  def self.get_token
    token = Token.last
    token.present? && token.created_at > 1.day.ago ? token.value : new_token.value
  end

  private

  def self.new_token
    getToken = Net::HTTP.post_form URI('https://www.arcgis.com/sharing/rest/oauth2/token'),
      f: 'json',
      client_id: 'yNhxJyA1OmmYpQCy',
      client_secret: 'f01e6759e387408ab705bb035e30bcb6',
      grant_type: 'client_credentials'

    Token.create(value: JSON.parse(getToken.body)['access_token'])
  end
end
