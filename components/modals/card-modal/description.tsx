"use client";

import { toast } from "sonner";
import { AlignLeft } from "lucide-react";
import { useParams } from "next/navigation";
import { useState, useRef, ElementRef, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useEventListener, useOnClickOutside } from "usehooks-ts";

import { useAction } from "@/hooks/use-action";
import { updateCard } from "@/actions/update-card";
import { CardWithList } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { FormTextarea } from "@/components/form/form-textarea";
import { FormSubmit } from "@/components/form/form-submit";
import { Button } from "@/components/ui/button";

import { Content } from "next/font/google";


import ReactQuill from 'react-quill';

import 'react-quill/dist/quill.snow.css';
// import ReactHtmlParser from 'react-html-parser';
import cloudinary from "cloudinary"
import dynamic from "next/dynamic";
import { app } from "@/firebaseConfig";
import { getStorage, ref, uploadBytesResumable } from "firebase/storage";




interface DescriptionProps {
  data: CardWithList;
  getAuditLogs: () => void;
};




export const Description = ({
  data,
  getAuditLogs
}: DescriptionProps) => {


  const [description, setDescription] = useState<string>(data.description || '');
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);



  //File Uploading Code   
  const [file, setFile] = useState(null);

  const handleFileChange = (e: any) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      // uploadFile(selectedFile);

    } else {
      return ('Please select a file');
    }
  };

  const Storage = getStorage(app) 

  const uploadFile = (file:any) => {
      const metadata = {
        contentType: file.type
      } 

      
      const storageRef = ref(Storage, 'file-upload/'+file?.name)
      const uploadTask = uploadBytesResumable(storageRef, file, metadata)

      uploadTask.on('state_changed',
  (snapshot) => {
    // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
    // console.log('Upload is ' + progress + '% done');
   
  })


  }

  const handleChange = (value: string) => {
    setDescription(value);
  };


  const params = useParams();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);

  const formRef = useRef<ElementRef<"form">>(null);
  const editorRef = useRef<any>(null);

  const textareaRef = useRef<ElementRef<"textarea">>(null);

  const enableEditing = () => {
    setIsEditing(true);
    setTimeout(() => {
      textareaRef.current?.focus();
    });
  }

  const disableEditing = () => {
    setIsEditing(false);
  };

  const onPdfInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPdfFile(file);
    } else {
      toast.error("Please select a PDF file");
    }
  };


  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      disableEditing();
    }
  };

  useEventListener("keydown", onKeyDown);
  useOnClickOutside(formRef, disableEditing);

  const { execute, fieldErrors } = useAction(updateCard, {
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["card", data.id],
      });
      getAuditLogs();
      toast.success(`Card "${data.title}" updated`);
      disableEditing();
    },
    onError: (error) => {
      toast.error(error);
    },
  });



  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const updatedDescription = editorRef.current?.getEditor().root.innerHTML;

    execute({
      id: data.id,
      description: updatedDescription || '',
      // pdfUrl: pdfUrl, // Use the uploaded PDF URL
      boardId: params.boardId as string,
    });
    disableEditing();
  };

  const modules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ["bold", "italic", "underline", "strike", "blockquote"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link", "image"],

      ["clean"],


    ],


  };
  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "blockquote",
    "list",
    "bullet",
    "link",
    "image",

  ];




  return (
    <div className="flex items-start gap-x-3 w-full">
      <AlignLeft className="h-5 w-5 mt-0.5 text-neutral-700" />
      <div className="w-full">
        <p className="font-semibold text-neutral-700 mb-2">
          Description
        </p>

        {isEditing ? (

          <>



            <form
              // action={onSubmit}
              onSubmit={onSubmit}
              ref={formRef}
              className="space-y-2"
              encType="multipart/form-data"
            >
          


              <ReactQuill
                theme="snow"
                value={description}
                onChange={setDescription} // This will update the React Quill content and also the form content
                ref={editorRef}
                modules={modules}
                formats={formats}


              />
              {/* <FormTextarea
              id="description"
              className="w-full mt-2"
              placeholder="Add a more detailed description"
              defaultValue={data.description || undefined}
              
              errors={fieldErrors}
              ref={textareaRef}
            /> */}
              <div className="flex items-center gap-x-2">
                <FormSubmit>
                  Save
                </FormSubmit>
                <Button
                  type="button"
                  onClick={disableEditing}
                  size="sm"
                  variant="ghost"
                >
                  Cancel
                </Button>
              </div>
            </form>

            

          </>
        ) : (
          <div
            onClick={enableEditing}
            role="button"
            className="min-h-[78px] bg-neutral-200 font-medium py-3 px-3.5 rounded-md"
          >
            {/* {data.description || "Add a more detailed description..."} */}

            <div className="description-content">
              {<div dangerouslySetInnerHTML={{ __html: description }}></div> || "Add a more detailed description..."}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

Description.Skeleton = function DescriptionSkeleton() {
  return (
    <div className="flex items-start gap-x-3 w-full">
      <Skeleton className="h-6 w-6 bg-neutral-200" />
      <div className="w-full">
        <Skeleton className="w-24 h-6 mb-2 bg-neutral-200" />
        <Skeleton className="w-full h-[78px] bg-neutral-200" />
      </div>
    </div>
  );
};
