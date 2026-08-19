// deno-lint-ignore-file no-explicit-any
//import fm from 'npm:front-matter@4.0.2';

const pathPrefix = "/articles/work"
export default function (ctx) {

  const filesP = Array.from([]
    // Deno.readDirSync(Deno.cwd() + "/media/articles"),
  );
  const filesW = Array.from(
    Deno.readDirSync(Deno.env.get("MEDIA_PATH") + pathPrefix),
  );
  const files = [
    ...filesP.map((f) => {
      console.log(f);
      return {
        title: `${f.name}`.replace(/\.md$/, ""),
        path: `${f.name}`
      };
    }),
    ...filesW.map((f) => {
      return {
        title: `${f.name}`.replace(/\.md$/, ""),
        path: `${f.name}`,
        //...fmcontent.attributes,
      };
    }),
  ];
  //return files;
  return new Date().toISOString();
}

// const content = "Hallo Welt"; //Deno.readFileSync(f.name);
// //     //console.log(content);
// //     //console.log(new TextDecoder().decode(content));
// const fmcontent = "fm(new TextDecoder().decode(content))";
//     //console.log(fmcontent)
//     //console.log(this.value());
//     // const { attributes, body } = fm (
//     //   content
//     // );
//     // this.title = attributes.title || '';
//     // if (attributes.published_at !== '') {
//     //   try {
//     //     this.publishedAt = new Date(attributes.published_at)
//     //       .toISOString();
//     //   } catch (e) {
//     //     this.publishedAt = '';
//     //   }
//     // }
//     // this.renderedMarkdown = md.render(body);
