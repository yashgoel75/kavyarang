"use client";

import Header from "@/components/header/page";
import Navigation from "@/components/navigation/page";
import Footer from "@/components/footer/page";
import { useState, useEffect } from "react";
import { getAuth, signOut, onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

interface Post {
  _id: string;
  title: string;
  content: string;
  picture?: string;
  likes: number;
  color: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user?.email) {
        fetchUserName(user.email);
      } else {
        router.replace("/");
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchUserName = async (email: string) => {
    try {
      // const token = await getFirebaseToken();
      const response = await fetch(
        `/api/user?email=${encodeURIComponent(email)}`,
        {
          headers: {
            // Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to fetch user name");
      setDisplayName(data.name);
      console.log("Fetched user name:", data.name);
    } catch (err) {
      console.error(err);
    }
  };

  const [posts, setPosts] = useState<Post[] | null>();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch(`/api/getPosts`);
        const data = await res.json();
        const filteredPosts = data.posts.filter((post: Post) => {
          return post.picture != null;
        });
        console.log(filteredPosts);
        setPosts(filteredPosts);
      } catch (error: unknown) {
        console.log(error);
      }
    };
    fetchPosts();
  }, []);

  return (
    <>
      <div className="min-h-screen flex flex-col">
        <Header />

        <div className="flex flex-1 relative">
          <div className="absolute left-0 h-[calc(100vh-7rem)] my-1 w-[300px] border-r border-gray-200 p-4">
            <div className="h-[15rem] border"></div>
            <div>
              <div className="w-full flex-1 flex mt-5 justify-center items-center px-5 py-2 rounded-lg bg-gray-100 space-y-5 gap-5">Feed</div>
              <div className="w-full flex-1 flex mt-5 justify-center items-center px-5 py-2 rounded-lg bg-gray-100 space-y-5 gap-5">Create Post</div>
              <div className="border-b mt-5"></div>
              <div className="h-[15rem] border mt-2"></div>
            </div>
          </div>

          <div className="flex-1 h-[calc(100vh-7rem)] overflow-scroll overscroll-contain ml-[300px] p-4">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Beatae sint pariatur explicabo atque enim nemo architecto doloremque blanditiis dolore ullam natus placeat ab repudiandae quas, mollitia aliquam rerum deleniti aspernatur magni, vitae cumque minima quis? Amet reiciendis alias debitis repudiandae incidunt doloribus, repellat magnam hic odio quibusdam veritatis, quos id unde, molestias dolor neque eaque sunt provident quaerat. Repellat, magni. Quidem quae at molestias amet ab minus esse, ipsum dolorum hic deserunt! Praesentium, ipsa minus quidem delectus officiis in nobis quaerat amet esse quod, rem assumenda minima, asperiores sapiente magnam porro. Laboriosam iste quod commodi porro id vero repellendus neque nihil harum cupiditate laudantium consectetur eum dicta, doloremque unde voluptas tenetur et quas minima doloribus fugit? Aspernatur odio ut neque sint tempore sit hic ullam incidunt nemo, natus cumque ducimus non mollitia numquam quaerat, unde nesciunt modi iste officiis eius aliquid voluptate ipsam. Ipsam dolores quisquam blanditiis harum aperiam vitae esse sunt, tempora rerum. Error accusamus, quod corrupti consequatur dicta quos praesentium, vero earum aperiam distinctio, temporibus necessitatibus! Sunt, deserunt at. Tempore earum consequatur facilis ipsum cum ea veniam deleniti ipsa blanditiis praesentium fugiat, quas, quidem laboriosam doloribus quibusdam sit cumque nesciunt asperiores necessitatibus voluptatibus, excepturi reprehenderit aliquid eaque! Culpa, molestias! Assumenda ipsam unde quasi quaerat sapiente pariatur sed quis facilis numquam laudantium? Maxime veritatis ea laboriosam sunt illo! Sapiente est assumenda obcaecati itaque perferendis molestiae vel! Placeat, dignissimos provident. Ut libero vero praesentium voluptatibus harum perspiciatis optio voluptatem blanditiis sequi doloribus! Itaque excepturi iste nam reprehenderit consequatur sit natus beatae, autem, architecto placeat minima quod quaerat inventore voluptatibus suscipit dolores harum quo repudiandae dolore eius explicabo. Doloribus eveniet, ad corrupti excepturi qui enim optio perferendis ex mollitia dignissimos suscipit beatae debitis, explicabo quis omnis ipsam officiis! Enim architecto numquam explicabo, libero aliquid sit omnis vero dolores alias fugiat nisi incidunt excepturi ex obcaecati laboriosam cumque? Itaque est rem quidem ab dignissimos nostrum ut, voluptas reprehenderit, enim suscipit distinctio voluptatem fuga rerum culpa quam quia? Voluptate explicabo asperiores necessitatibus voluptatibus deserunt dolorem, suscipit quo unde, possimus laborum nihil doloribus, totam omnis temporibus. Odio dolore corrupti aperiam porro? Odit, distinctio veritatis corporis velit, obcaecati beatae quis impedit, ut officiis porro quaerat ea. Voluptas laudantium omnis sed mollitia temporibus numquam expedita iure labore quam, corrupti et reiciendis eligendi, adipisci deserunt sapiente optio molestias ipsa veniam accusantium id placeat voluptatibus, ratione distinctio dicta. Quidem aut tenetur consequuntur at minima asperiores adipisci, mollitia facilis sequi dolorem incidunt ducimus quae consequatur harum laborum neque nulla ex tempora voluptatum excepturi blanditiis voluptatem? Repudiandae odio soluta corporis! Rem animi vel nostrum sit qui praesentium incidunt, repellendus vitae ea laudantium voluptas distinctio modi porro, impedit necessitatibus corporis sapiente earum veniam nihil labore nulla architecto. Voluptas iusto nesciunt commodi. Ullam omnis expedita obcaecati quisquam quas, nam ex doloribus sed exercitationem quaerat maiores assumenda unde adipisci magni iste autem est voluptatibus commodi facilis repellendus illo id vero! Iusto inventore corporis sequi quidem vero optio quod sed nihil deleniti, quibusdam quae nemo totam consequatur beatae adipisci voluptatibus minima! Dolor, eligendi libero laboriosam praesentium sit quaerat doloremque asperiores, ipsum maiores recusandae veritatis quasi eos non at minima omnis quisquam hic perferendis amet velit officia molestiae nemo deserunt. Aspernatur expedita incidunt totam iure sed in tempore illum ullam odio praesentium odit magnam eveniet cum explicabo ratione porro hic voluptate provident ipsam nostrum id, commodi sapiente. Aliquam, molestiae vitae officiis autem illo fugiat fuga facilis, accusamus omnis animi aut quod perferendis dolores. Quaerat enim culpa dignissimos sit eum? Sit et ut ducimus dolorum, consequuntur sunt corrupti labore itaque quo quidem repellat nostrum nulla laudantium officiis iusto doloribus vel praesentium qui cupiditate quas suscipit cum. Nisi, sunt pariatur aperiam architecto incidunt aliquam minus obcaecati vel recusandae minima sed ad, totam non, voluptates necessitatibus distinctio cupiditate doloribus placeat rerum hic. Facilis, corporis nobis nihil hic eum autem aliquid minus eos voluptates, distinctio dolore incidunt id libero cum et magnam voluptatem quas nulla cupiditate fugiat aperiam maxime! Unde tenetur natus nostrum dolores perspiciatis? Soluta id accusamus rerum ducimus enim. Odit esse dolorum mollitia ullam modi reiciendis molestiae! Dolore id placeat voluptatem libero modi eius aliquam laborum quaerat aliquid ducimus veritatis totam quasi ipsam repudiandae distinctio, rerum repellat laudantium. Ut accusantium dolor ex quis officia, atque ipsum recusandae perspiciatis temporibus odit nihil porro ad cumque dolorum illo culpa necessitatibus dicta quibusdam dignissimos quae delectus accusamus eveniet! Magnam eligendi ratione velit a et? Quis ullam labore voluptas saepe qui molestiae possimus porro eum tenetur nesciunt? Odio eos dolor ullam delectus error deserunt facilis impedit, et necessitatibus in dignissimos sunt modi id mollitia placeat voluptatem qui maiores totam alias. Commodi architecto, voluptatum laborum doloremque quis assumenda alias, maiores consectetur natus mollitia dolore quam delectus molestiae provident magnam non, harum odio? Ratione, unde. Quae voluptatem ducimus mollitia sapiente in voluptate quis reprehenderit repellat? Maxime quibusdam facere mollitia saepe quasi provident officia, ea voluptate! Voluptas rerum quidem eos quasi debitis illo necessitatibus aliquid? Voluptate, iure! Soluta vero magni neque. Consequatur, placeat eum. Ad autem modi, soluta obcaecati in aliquam, amet aperiam id reprehenderit doloribus doloremque repudiandae nemo eum optio voluptate laudantium. Quisquam quis animi, nihil commodi aperiam quam nisi facere iusto alias! Consequatur corporis velit fugit incidunt voluptatem laudantium eaque laborum perspiciatis! Quo, nisi quisquam! Ea nam et tempora asperiores nulla recusandae, omnis, id facere, architecto alias laborum iste similique. Saepe eius unde placeat mollitia, maxime inventore odio illo similique! Magnam, eligendi dicta aut nobis, qui officiis optio dolorem assumenda dolor atque ad voluptates, eum rerum facilis. Et facilis cum cupiditate vitae aspernatur eligendi repellat iusto omnis laudantium quaerat, asperiores debitis. Animi aspernatur tenetur natus corporis aut quaerat dignissimos, quod, aliquam numquam ducimus doloribus blanditiis itaque quia debitis excepturi a! Culpa, animi consequuntur totam molestiae, vero aperiam, sapiente a esse odio sint delectus quis. Maiores quos, earum, odit dolorem nesciunt in debitis, eum eaque animi dignissimos unde corporis optio cupiditate blanditiis accusamus mollitia labore nobis! Hic fuga sequi tempora provident nihil iusto aperiam facilis mollitia fugiat quo. Natus quas ea delectus. Vitae molestiae quod distinctio provident? Illo quae suscipit eius dicta quo.
          </div>
        </div>

        <Navigation />
      </div>
    </>
  );
}
