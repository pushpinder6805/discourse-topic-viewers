# frozen_string_literal: true

module DiscourseTopicViewers
  class TopicViewersController < ::ApplicationController
    requires_plugin "discourse-topic-viewers"
    before_action :ensure_logged_in

    def index
      topic_id = params[:topic_id].to_i

      topic_users = TopicUser
        .where(topic_id: topic_id)
        .order(last_visited_at: :desc)
        .limit(200)
        .includes(:user)

      users = topic_users.map do |tu|
        u = tu.user
        next unless u

        {
          id: u.id,
          username: u.username,
          name: u.name,
          avatar_template: u.avatar_template,
          viewed_at: tu.last_visited_at
        }
      end.compact

      render json: { users: users }
    end
  end
end
