# frozen_string_literal: true

class TopicViewersController < ApplicationController
  requires_plugin :discourse_topic_viewers

  def show
    topic_id = params[:topic_id].to_i

    # Fetch last viewers from TopicUser table
    topic_users = TopicUser
      .where(topic_id: topic_id)
      .order("updated_at DESC")
      .limit(50)
      .includes(:user)

    users = topic_users.map do |tu|
      u = tu.user
      {
        id: u.id,
        username: u.username,
        name: u.name,
        avatar_template: u.avatar_template,
        viewed_at: tu.updated_at
      }
    end

    render json: { users: users }
  end
end
