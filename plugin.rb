# frozen_string_literal: true

# name: discourse-topic-viewers
# about: Show list of users who viewed a topic when clicking the Viewers button
# version: 0.2
# authors: Pushpender Singh
# url: https://example.com/discourse-topic-viewers

enabled_site_setting :topic_viewers_enabled

register_asset "stylesheets/common/topic-viewers.scss"

after_initialize do
  module ::DiscourseTopicViewers
    PLUGIN_NAME = "discourse-topic-viewers"
  end

  class ::DiscourseTopicViewers::Engine < ::Rails::Engine
    engine_name DiscourseTopicViewers::PLUGIN_NAME
    isolate_namespace DiscourseTopicViewers
  end

  #
  # ROUTES
  #
  Discourse::Application.routes.append do
    mount ::DiscourseTopicViewers::Engine, at: "/"
  end

  ::DiscourseTopicViewers::Engine.routes.draw do
    get "/topic-viewers/:topic_id" => "topic_viewers#index", defaults: { format: :json }
  end

  #
  # CONTROLLER
  #
  module ::DiscourseTopicViewers
    class TopicViewersController < ::ApplicationController
      requires_plugin DiscourseTopicViewers::PLUGIN_NAME

      before_action :ensure_logged_in

      def index
        topic_id = params[:topic_id].to_i
        topic = Topic.find_by(id: topic_id)

        raise Discourse::NotFound unless topic
        guardian.ensure_can_see!(topic)

        # Use TopicUser instead of TopicView (modern Discourse)
        users = TopicUser
          .where(topic_id: topic_id)
          .joins(:user)
          .includes(:user)
          .order("topic_users.last_visited_at DESC NULLS LAST")
          .limit(500)
          .map do |topic_user|
            user = topic_user.user
            {
              id: user.id,
              username: user.username,
              name: user.name,
              avatar_url: user.avatar_template_url.gsub("{size}", "45"),
              viewed_at: topic_user.last_visited_at
            }
          end

        render_json_dump(users: users)
      end
    end
  end
end
