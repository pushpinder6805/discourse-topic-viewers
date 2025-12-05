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
        post_number = params[:post_number].to_i
        
        topic = Topic.find_by(id: topic_id)
        raise Discourse::NotFound unless topic
        guardian.ensure_can_see!(topic)

        # Basic query: Users who visited this topic
        query = TopicUser
          .where(topic_id: topic_id)
          .joins(:user)
          .includes(:user)
          .order("topic_users.last_visited_at DESC NULLS LAST")

        # FILTER: Only show users who have read AT LEAST up to this post
        if post_number > 0
          query = query.where("topic_users.last_read_post_number >= ?", post_number)
        end

        users = query.limit(500).map do |topic_user|
          user = topic_user.user
          
          # FIX: Manually replace {size} in the template string
          avatar_url = user.avatar_template.gsub("{size}", "45")
          
          # Ensure URL is absolute if it's not (optional, but good for safety)
          if !avatar_url.start_with?("http") && !avatar_url.start_with?("/")
             avatar_url = "/#{avatar_url}" 
          end

          {
            id: user.id,
            username: user.username,
            name: user.name,
            avatar_url: avatar_url,
            viewed_at: topic_user.last_visited_at
          }
        end

        render_json_dump(users: users)
      end
    end
  end
end
