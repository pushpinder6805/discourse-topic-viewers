# frozen_string_literal: true
# name: discourse-topic-viewers
# about: Show list of users who viewed a specific post
# version: 0.3
# authors: Pushpender Singh

enabled_site_setting :topic_viewers_enabled

register_asset "stylesheets/common/topic-viewers.scss"

after_initialize do
  module ::DiscourseTopicViewers
    PLUGIN_NAME = "discourse-topic-viewers"
  end

  require_dependency "application_controller"

  class ::DiscourseTopicViewers::Engine < ::Rails::Engine
    engine_name "discourse_topic_viewers"
    isolate_namespace DiscourseTopicViewers
  end

  DiscourseTopicViewers::Engine.routes.draw do
    get "/topic_viewers/:topic_id/:post_number" => "topic_viewers#index"
  end

  Discourse::Application.routes.append do
    mount ::DiscourseTopicViewers::Engine, at: "/"
  end

  module ::DiscourseTopicViewers
    class TopicViewersController < ::ApplicationController
      requires_plugin ::DiscourseTopicViewers::PLUGIN_NAME
      before_action :ensure_logged_in

      def index
        topic_id = params.require(:topic_id).to_i
        # post_number param is provided for context, but we're returning viewers for the topic
        # Cap result to a reasonable number
        topic_users = TopicUser.where(topic_id: topic_id).order(last_visited_at: :desc).limit(200)

        users = topic_users.includes(:user).map do |tu|
          user = tu.user
          next unless user
          {
            id: user.id,
            username: user.username,
            name: user.name,
            avatar_template: user.avatar_template,
            viewed_at: tu.last_visited_at
          }
        end.compact

        render_json_dump(users: users)
      end
    end
  end
end
