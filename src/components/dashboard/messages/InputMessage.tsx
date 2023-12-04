import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { useContext, useRef } from "react";
import { MessageContext } from "./MessageContext";

interface InputMessageProps {
  isDisabled?: boolean;
  isMember?: boolean;
}

const InputMessage = ({ isDisabled, isMember }: InputMessageProps) => {
  const { addMessage, handleInputChange, isLoading, message, characterLeft } =
    useContext(MessageContext);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  return (
    <>
      <div className="relative">
        <Textarea
          ref={textareaRef}
          rows={1}
          maxRows={4}
          maxLength={isMember ? 400 : 200}
          autoFocus
          onChange={handleInputChange}
          value={message}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();

              addMessage();

              textareaRef.current?.focus();
            }
          }}
          placeholder="Enter your question..."
          className="resize-none pr-12 text-base py-3 scrollbar-thumb-blue scrollbar-thumb-rounded scrollbar-track-blue-lighter scrollbar-w-2 scrolling-touch"
        />

        <Button
          disabled={isLoading || isDisabled}
          aria-label="send message"
          variant="ghost"
          size="sm"
          className="absolute bottom-1.5 right-[8px]"
          onClick={() => {
            addMessage();

            textareaRef.current?.focus();
          }}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mt-2">
        You have {characterLeft} of {isMember ? "400" : "200"} character(s)
        remaining.
      </p>
    </>

    // <div className="w-full">
    //   <div className="mx-2 flex flex-row gap-3 md:mx-4 md:last:mb-5 lg:mx-auto lg:max-w-2xl xl:max-w-3xl">
    //     <div className="relative flex h-full flex-1 items-stretch md:flex-col">
    //       <div className="relative flex flex-col w-full flex-grow p-4">
    //         <div className="relative">
    //           <Textarea
    //             ref={textareaRef}
    //             rows={1}
    //             maxRows={4}
    //             maxLength={isMember ? 400 : 200}
    //             autoFocus
    //             onChange={handleInputChange}
    //             value={message}
    //             onKeyDown={(e) => {
    //               if (e.key === "Enter" && !e.shiftKey) {
    //                 e.preventDefault();

    //                 addMessage();

    //                 textareaRef.current?.focus();
    //               }
    //             }}
    //             placeholder="Enter your question..."
    //             className="resize-none pr-12 text-base py-3 scrollbar-thumb-blue scrollbar-thumb-rounded scrollbar-track-blue-lighter scrollbar-w-2 scrolling-touch"
    //           />

    //           <Button
    //             disabled={isLoading || isDisabled}
    //             aria-label="send message"
    //             variant="ghost"
    //             className="absolute bottom-1.5 right-[8px]"
    //             onClick={() => {
    //               addMessage();

    //               textareaRef.current?.focus();
    //             }}
    //           >
    //             <Send className="h-4 w-4" />
    //           </Button>
    //         </div>
    //         <p className="text-sm text-muted-foreground mt-2">
    //           You have {characterLeft} of {isMember ? "400" : "200"}{" "}
    //           character(s) remaining.
    //         </p>
    //       </div>
    //     </div>
    //   </div>
    // </div>
  );
};

export default InputMessage;
