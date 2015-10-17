class CreateTokens < ActiveRecord::Migration
  def change
    create_table :tokens do |t|

      t.text :value

      t.timestamps
    end
  end
end
