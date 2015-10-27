require 'json'
require 'net/http'

class Proxy < ActiveRecord::Base

  def self.request(url)
    result = Net::HTTP.post_form URI(url),
      f: 'json',
      token: Token.get_token_always # Use get_token

      p result.class

    JSON.parse(result.body)
  end
end
