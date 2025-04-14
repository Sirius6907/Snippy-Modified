import { X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore"; // Import useChatStore

const ChatHeader = () => {
  const { selectedUser, setSelectedUser, isTyping } = useChatStore(); // Added isTyping
  const { onlineUsers } = useAuthStore();

  if (!selectedUser) return null;

  const online = onlineUsers.includes(selectedUser._id);

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        {/* Avatar + Info */}
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="avatar">
            <div className="size-10 rounded-full relative">
              <img
                src={selectedUser.profilePic || "/avatar.png"}
                alt={selectedUser.fullName}
              />
              {online && (
                <span className="absolute bottom-0 right-0 size-2.5 bg-green-500 rounded-full ring-1 ring-base-100" />
              )}
            </div>
          </div>

          {/* User Info */}
          <div className="min-w-0">
            <h3 className="font-medium truncate">{selectedUser.fullName}</h3>
            <p className="text-sm text-base-content/70 truncate">
              {isTyping ? (
                <span className="italic text-primary">typing...</span>
              ) : (
                online ? "Online" : "Offline"
              )}
            </p>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={() => setSelectedUser(null)}
          className="btn btn-ghost btn-sm btn-circle"
          aria-label="Close chat"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
