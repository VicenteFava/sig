require 'json'
require 'net/http'

class Proxy < ActiveRecord::Base

  def self.request(url)
    result = Net::HTTP.post_form URI(url),
      f: 'json',
      token: Token.get_token

    JSON.parse(result.body)
  end
end
