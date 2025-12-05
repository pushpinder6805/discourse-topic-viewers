# frozen_string_literal: true

# name: discourse-topic-viewers
# about: Show list of users who viewed a topic when clicking the Views count
# version: 0.1
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

  Discourse::Application.routes.append do
    mount ::DiscourseTopicViewers::Engine, at: "/"
  end

  ::DiscourseTopicViewers::Engine.routes.draw do
    get "/topic-viewers/:topic_id" => "topic_viewers#index", defaults: { format: :json }
  end

  module ::DiscourseTopicViewers
    class TopicViewersController < ::ApplicationController
      requires_plugin DiscourseTopicViewers::PLUGIN_NAME

      before_action :ensure_logged_in

      def index
        topic_id = params[:topic_id].to_i
        guardian.ensure_can_see!(Topic.find(topic_id))

        # Use TopicView records, one per user per topic
        views = TopicView
          .where(topic_id: topic_id)
          .joins(:user)
          .select(
            "users.id, users.username, users.name, users.avatar_template, topic_views.viewed_at"
          )
          .order("topic_views.viewed_at DESC")
          .limit(500)

        users = views.map do |v|
          {
            id: v.id,
            username: v.username,
            name: v.name,
            avatar_url: User.avatar_template(v.avatar_template, 45),
            viewed_at: v.viewed_at
          }
        end

        render_json_dump(users: users)
      end
    end
  end
end

