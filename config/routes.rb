# frozen_string_literal: true

Discourse::Application.routes.append do
  get "/topic_viewers/:topic_id/:post_number" => "topic_viewers#show"
end
